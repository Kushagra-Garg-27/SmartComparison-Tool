/**
 * Price Extraction Service — fetches product pages and extracts prices.
 *
 * Strategy:
 *   1. Fetch page HTML via axios with browser-like headers
 *   2. Parse with Cheerio
 *   3. Try platform-specific CSS selectors first
 *   4. Fall back to JSON-LD structured data (Schema.org)
 *   5. Fall back to <meta> price tags
 *   6. Last resort: regex scan for currency patterns
 *
 * Concurrency is capped via a simple semaphore to avoid overwhelming
 * target sites and to keep backend responsive.
 *
 * Usage:
 *   const extractor = new PriceExtractor();
 *   const results = await extractor.extractPrices(listings);
 */

import axios, { type AxiosInstance } from "axios";
import * as cheerio from "cheerio";

// --- Public types ---

export interface PriceExtractionInput {
  platform: string;
  title: string;
  url: string;
}

export interface PriceExtractionResult {
  platform: string;
  title: string;
  url: string;
  price: number | null;
  currency: string;
  extractedVia: "selector" | "json-ld" | "meta" | "regex" | "none";
  error: string | null;
}

// --- Platform-specific selector configs ---

interface SelectorConfig {
  /** CSS selectors tried in order — first match wins */
  priceSelectors: string[];
  /** Optional currency selector override */
  currencySelector?: string;
}

const PLATFORM_SELECTORS: Record<string, SelectorConfig> = {
  Amazon: {
    priceSelectors: [
      ".a-price .a-offscreen",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      "#corePrice_feature_div .a-offscreen",
      "#apex_offerDisplay_desktop .a-offscreen",
      'span[data-a-color="price"] .a-offscreen',
      "#price_inside_buybox",
      "#newBuyBoxPrice",
      ".priceToPay .a-offscreen",
    ],
  },
  BestBuy: {
    priceSelectors: [
      ".priceView-customer-price span",
      ".priceView-hero-price span",
      '[data-testid="customer-price"] span',
      ".pricing-price__regular-price",
    ],
  },
  Walmart: {
    priceSelectors: [
      '[data-testid="price-wrap"] [itemprop="price"]',
      '[itemprop="price"]',
      ".price-characteristic",
      '[data-automation="buybox-price"]',
      ".prod-PriceHero .price-group",
    ],
  },
  eBay: {
    priceSelectors: [
      ".x-price-primary .ux-textspans",
      "#prcIsum",
      '[itemprop="price"]',
      ".x-bin-price__content .ux-textspans",
    ],
  },
  Flipkart: {
    priceSelectors: [
      "._30jeq3",
      "._16Jk6d",
      ".Nx9bqj", // newer Flipkart layouts
      "._3I9_wc",
      '[class*="CxhGGd"]', // product page price
    ],
  },
};

// --- Helpers ---

/** Shared browser-like headers to avoid trivial bot-blocking. */
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

/**
 * Parse a price string like "$799.99", "₹79,999", "£1,299.00", "US $549.00"
 * into a numeric value, or null if unparseable.
 */
function parsePrice(raw: string): { price: number; currency: string } | null {
  if (!raw || raw.trim().length === 0) return null;

  // Normalise whitespace
  const text = raw.replace(/\s+/g, " ").trim();

  // Detect currency symbol / code
  let currency = "USD";
  if (text.includes("₹") || text.toLowerCase().includes("inr"))
    currency = "INR";
  else if (text.includes("£") || text.toLowerCase().includes("gbp"))
    currency = "GBP";
  else if (text.includes("€") || text.toLowerCase().includes("eur"))
    currency = "EUR";
  else if (text.includes("$")) currency = "USD";

  // Extract numeric portion: strip everything except digits, commas, dots
  const numericMatch = text.match(/([\d,]+(?:\.\d{1,2})?)/);
  if (!numericMatch) return null;

  const cleaned = numericMatch[1].replace(/,/g, "");
  const value = parseFloat(cleaned);

  if (isNaN(value) || value <= 0 || value > 999_999) return null;
  return { price: value, currency };
}

/** The type returned by cheerio.load() */
type CheerioRoot = ReturnType<typeof cheerio.load>;

/**
 * Try to extract price from JSON-LD (Schema.org Product / Offer) embedded in the page.
 * Many retailer pages include structured data that is more reliable than DOM selectors.
 */
function extractFromJsonLd(
  $: CheerioRoot,
): { price: number; currency: string } | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const json = JSON.parse($(scripts[i]).html() || "");
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        // Direct Product with offers
        const offers = item.offers || item.Offers;
        if (offers) {
          const offerList = Array.isArray(offers) ? offers : [offers];
          for (const offer of offerList) {
            const p =
              offer.price ?? offer.lowPrice ?? offer.Price ?? offer.LowPrice;
            if (p !== undefined) {
              const price = typeof p === "string" ? parseFloat(p) : p;
              if (!isNaN(price) && price > 0) {
                return {
                  price,
                  currency: offer.priceCurrency || offer.PriceCurrency || "USD",
                };
              }
            }
          }
        }
        // Nested @graph
        if (item["@graph"]) {
          for (const node of item["@graph"]) {
            if (
              node["@type"] === "Product" ||
              node["@type"] === "IndividualProduct"
            ) {
              const nestedOffers = node.offers || node.Offers;
              if (nestedOffers) {
                const list = Array.isArray(nestedOffers)
                  ? nestedOffers
                  : [nestedOffers];
                for (const o of list) {
                  const p = o.price ?? o.lowPrice;
                  if (p !== undefined) {
                    const price = typeof p === "string" ? parseFloat(p) : p;
                    if (!isNaN(price) && price > 0) {
                      return {
                        price,
                        currency: o.priceCurrency || "USD",
                      };
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Malformed JSON-LD — skip
    }
  }
  return null;
}

/**
 * Try to extract price from <meta> tags (og:price:amount, product:price:amount, etc.)
 */
function extractFromMeta(
  $: CheerioRoot,
): { price: number; currency: string } | null {
  const metaSelectors = [
    'meta[property="og:price:amount"]',
    'meta[property="product:price:amount"]',
    'meta[name="price"]',
    'meta[itemprop="price"]',
    'meta[property="product:price"]',
  ];

  for (const sel of metaSelectors) {
    const content = $(sel).attr("content");
    if (content) {
      const price = parseFloat(content.replace(/[^0-9.]/g, ""));
      if (!isNaN(price) && price > 0) {
        // Try to get currency from a sibling meta
        const currencyMeta =
          $('meta[property="og:price:currency"]').attr("content") ||
          $('meta[property="product:price:currency"]').attr("content") ||
          $('meta[itemprop="priceCurrency"]').attr("content") ||
          "USD";
        return { price, currency: currencyMeta };
      }
    }
  }
  return null;
}

/**
 * Last-resort regex scan for currency patterns in the visible text.
 * Scans the first 50KB of text content to avoid excessive processing.
 */
function extractViaRegex(
  html: string,
): { price: number; currency: string } | null {
  // Limit scan to first 50KB
  const text = html.slice(0, 50_000);

  // Match price patterns: $799.99, ₹79,999.00, £1,299, €599, US $549.00
  const patterns = [
    /\$\s?([\d,]+(?:\.\d{2})?)/g,
    /₹\s?([\d,]+(?:\.\d{2})?)/g,
    /£\s?([\d,]+(?:\.\d{2})?)/g,
    /€\s?([\d,]+(?:\.\d{2})?)/g,
    /USD\s?\$?\s?([\d,]+(?:\.\d{2})?)/gi,
    /INR\s?₹?\s?([\d,]+(?:\.\d{2})?)/gi,
  ];

  const candidates: { price: number; currency: string }[] = [];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const cleaned = match[1].replace(/,/g, "");
      const price = parseFloat(cleaned);
      if (!isNaN(price) && price > 1 && price < 100_000) {
        let currency = "USD";
        if (pattern.source.includes("₹") || pattern.source.includes("INR"))
          currency = "INR";
        else if (pattern.source.includes("£")) currency = "GBP";
        else if (pattern.source.includes("€")) currency = "EUR";
        candidates.push({ price, currency });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Heuristic: the most-frequently occurring price is likely the product price.
  // If tied, pick the first occurrence.
  const freq = new Map<number, number>();
  for (const c of candidates) {
    freq.set(c.price, (freq.get(c.price) || 0) + 1);
  }

  let best = candidates[0];
  let bestCount = freq.get(best.price) || 0;
  for (const c of candidates) {
    const count = freq.get(c.price) || 0;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }

  return best;
}

// --- Simple concurrency limiter ---

class Semaphore {
  private queue: (() => void)[] = [];
  private active = 0;

  constructor(private concurrency: number) {}

  async acquire(): Promise<void> {
    if (this.active < this.concurrency) {
      this.active++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.active++;
        resolve();
      });
    });
  }

  release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }
}

// --- Main Service ---

export class PriceExtractor {
  private client: AxiosInstance;
  private semaphore: Semaphore;

  constructor(concurrency = 3) {
    this.semaphore = new Semaphore(concurrency);
    this.client = axios.create({
      timeout: 12_000,
      maxRedirects: 5,
      headers: BROWSER_HEADERS,
      // Accept compressed responses
      decompress: true,
      // Don't throw on non-2xx so we can handle gracefully
      validateStatus: (status) => status < 500,
    });
  }

  /**
   * Extract prices from multiple listing URLs concurrently.
   * Respects the concurrency limit set in the constructor.
   */
  async extractPrices(
    listings: PriceExtractionInput[],
  ): Promise<PriceExtractionResult[]> {
    const results = await Promise.allSettled(
      listings.map((listing) => this.extractSingle(listing)),
    );

    return results.map((r, idx) => {
      if (r.status === "fulfilled") return r.value;

      // Promise rejected (unexpected) — return error result
      return {
        platform: listings[idx].platform,
        title: listings[idx].title,
        url: listings[idx].url,
        price: null,
        currency: "USD",
        extractedVia: "none" as const,
        error: (r.reason as Error)?.message || "Unknown extraction error",
      };
    });
  }

  /**
   * Extract price from a single product page URL.
   */
  private async extractSingle(
    input: PriceExtractionInput,
  ): Promise<PriceExtractionResult> {
    const base: Omit<
      PriceExtractionResult,
      "price" | "currency" | "extractedVia" | "error"
    > = {
      platform: input.platform,
      title: input.title,
      url: input.url,
    };

    // Skip URLs that are search pages — no price to extract
    if (this.isSearchPageUrl(input.url)) {
      return {
        ...base,
        price: null,
        currency: "USD",
        extractedVia: "none",
        error: "URL is a search/category page, not a product page",
      };
    }

    await this.semaphore.acquire();
    try {
      const response = await this.client.get(input.url);

      if (response.status >= 400) {
        return {
          ...base,
          price: null,
          currency: "USD",
          extractedVia: "none",
          error: `HTTP ${response.status}`,
        };
      }

      const html: string =
        typeof response.data === "string"
          ? response.data
          : String(response.data);

      const $ = cheerio.load(html);

      // --- Strategy 1: Platform-specific CSS selectors ---
      const selectorResult = this.extractViaSelectors($, input.platform);
      if (selectorResult) {
        console.log(
          `[PriceExtractor] ${input.platform}: $${selectorResult.price} via selector`,
        );
        return {
          ...base,
          price: selectorResult.price,
          currency: selectorResult.currency,
          extractedVia: "selector",
          error: null,
        };
      }

      // --- Strategy 2: JSON-LD structured data ---
      const jsonLdResult = extractFromJsonLd($);
      if (jsonLdResult) {
        console.log(
          `[PriceExtractor] ${input.platform}: $${jsonLdResult.price} via JSON-LD`,
        );
        return {
          ...base,
          price: jsonLdResult.price,
          currency: jsonLdResult.currency,
          extractedVia: "json-ld",
          error: null,
        };
      }

      // --- Strategy 3: <meta> tags ---
      const metaResult = extractFromMeta($);
      if (metaResult) {
        console.log(
          `[PriceExtractor] ${input.platform}: $${metaResult.price} via meta tag`,
        );
        return {
          ...base,
          price: metaResult.price,
          currency: metaResult.currency,
          extractedVia: "meta",
          error: null,
        };
      }

      // --- Strategy 4: Regex fallback ---
      const regexResult = extractViaRegex(html);
      if (regexResult) {
        console.log(
          `[PriceExtractor] ${input.platform}: $${regexResult.price} via regex`,
        );
        return {
          ...base,
          price: regexResult.price,
          currency: regexResult.currency,
          extractedVia: "regex",
          error: null,
        };
      }

      // All strategies failed
      console.warn(
        `[PriceExtractor] ${input.platform}: Could not extract price from ${input.url}`,
      );
      return {
        ...base,
        price: null,
        currency: "USD",
        extractedVia: "none",
        error: "No price found on page",
      };
    } catch (err) {
      const message = (err as Error).message || "Fetch failed";
      console.error(`[PriceExtractor] ${input.platform} error: ${message}`);
      return {
        ...base,
        price: null,
        currency: "USD",
        extractedVia: "none",
        error: message,
      };
    } finally {
      this.semaphore.release();
    }
  }

  /**
   * Try platform-specific CSS selectors for price extraction.
   */
  private extractViaSelectors(
    $: CheerioRoot,
    platform: string,
  ): { price: number; currency: string } | null {
    const config = PLATFORM_SELECTORS[platform];
    if (!config) return null;

    for (const selector of config.priceSelectors) {
      const elements = $(selector);
      for (let i = 0; i < elements.length; i++) {
        const text = $(elements[i]).text();
        const result = parsePrice(text);
        if (result) return result;

        // Also check "content" attribute (some sites use hidden spans)
        const content = $(elements[i]).attr("content");
        if (content) {
          const attrResult = parsePrice(content);
          if (attrResult) return attrResult;
        }
      }
    }

    return null;
  }

  /**
   * Detect if a URL is a search/category page rather than a product detail page.
   */
  private isSearchPageUrl(url: string): boolean {
    const lower = url.toLowerCase();
    return (
      lower.includes("/s?k=") ||
      lower.includes("/search?") ||
      lower.includes("searchpage.jsp") ||
      lower.includes("/sch/i.html") ||
      lower.includes("/gp/browse") ||
      (lower.includes("?q=") &&
        !lower.includes("/dp/") &&
        !lower.includes("/ip/"))
    );
  }
}
