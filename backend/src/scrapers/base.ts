/**
 * Scraper Base — Consistent interface for all store scrapers.
 *
 * Every store scraper must implement the StoreScraper interface.
 * The ScraperResult provides a normalized output across all stores.
 */

export interface ScraperResult {
  store: string;
  title: string;
  price: number | null;
  originalPrice: number | null;
  currency: string;
  url: string;
  externalId: string | null;
  availability: boolean;
  seller: string | null;
  sellerRating: number | null;
  rating: number | null;
  reviewCount: number | null;
  deliveryInfo: string | null;
  returnPolicy: string | null;
  image: string | null;
  extractedVia: "selector" | "json-ld" | "meta" | "regex" | "api" | "none";
  error: string | null;
  scrapedAt: string;
}

export interface ScraperSearchResult {
  title: string;
  url: string;
  price: number | null;
  image: string | null;
  store: string;
}

export interface StoreScraper {
  /** Unique store identifier (must match StoreConfig.id) */
  readonly storeId: string;

  /** Extract product data from a product page URL */
  scrapeProduct(url: string): Promise<ScraperResult>;

  /** Search for a product on this store by query string */
  searchProducts(query: string, limit?: number): Promise<ScraperSearchResult[]>;
}

/**
 * Shared utilities for all scrapers.
 */

/** Parse a price string into a number, handling various formats */
export function parsePrice(text: string): number | null {
  if (!text) return null;
  // Remove currency symbols, spaces, and non-numeric chars except . and ,
  const cleaned = text
    .replace(/[₹$€£¥]/g, "")
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .trim();
  const match = cleaned.match(/(\d+\.?\d*)/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return isNaN(value) ? null : value;
}

/** Detect currency from text or domain */
export function detectCurrency(text: string, domain?: string): string {
  if (text.includes("₹") || domain?.includes(".in")) return "INR";
  if (text.includes("$") || domain?.includes(".com")) return "USD";
  if (text.includes("£") || domain?.includes(".co.uk")) return "GBP";
  if (text.includes("€")) return "EUR";
  return "INR"; // Default for India-focused stores
}

/** Extract JSON-LD structured data from HTML */
export function extractJsonLd(html: string): Record<string, unknown> | null {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      // Check for @graph array
      if (data["@graph"]) {
        const product = (data["@graph"] as Record<string, unknown>[]).find(
          (item) => (item["@type"] as string)?.includes("Product"),
        );
        if (product) return product;
      }
      if (
        typeof data["@type"] === "string" &&
        data["@type"].includes("Product")
      ) {
        return data;
      }
      if (Array.isArray(data)) {
        const product = data.find(
          (item) =>
            typeof item["@type"] === "string" &&
            item["@type"].includes("Product"),
        );
        if (product) return product;
      }
    } catch {
      // Invalid JSON, continue
    }
  }
  return null;
}

/** Extract price from JSON-LD offers */
export function extractPriceFromJsonLd(jsonLd: Record<string, unknown>): {
  price: number | null;
  originalPrice: number | null;
  currency: string;
} {
  const offers = jsonLd.offers as Record<string, unknown> | undefined;
  if (!offers) return { price: null, originalPrice: null, currency: "INR" };

  const offerData = Array.isArray(offers) ? offers[0] : offers;
  const price =
    parseFloat(String(offerData?.price ?? offerData?.lowPrice ?? "")) || null;
  const highPrice = parseFloat(String(offerData?.highPrice ?? "")) || null;
  const currency = String(offerData?.priceCurrency ?? "INR");

  return { price, originalPrice: highPrice, currency };
}

/** Safe HTTP fetch with timeout, user-agent rotation, and retry logic */
export async function safeFetch(
  url: string,
  timeoutMs = 12000,
  retries = 2,
): Promise<string> {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Add jittered delay between retries
      if (attempt > 0) {
        const jitter = Math.random() * 500;
        await new Promise(r => setTimeout(r, 800 * attempt + jitter));
      }

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": userAgents[Math.floor(Math.random() * userAgents.length)],
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        // Don't retry on 403/429 — likely blocked
        if (response.status === 403 || response.status === 429) {
          throw new Error(`HTTP ${response.status}: ${response.statusText} (blocked)`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Don't retry on explicit blocks
      if (lastError.message.includes("blocked") || lastError.message.includes("HTTP 4")) {
        break;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

/** Create a base ScraperResult with defaults */
export function createBaseResult(
  storeId: string,
  url: string,
): ScraperResult {
  return {
    store: storeId,
    title: "",
    price: null,
    originalPrice: null,
    currency: "INR",
    url,
    externalId: null,
    availability: true, // Default to available; scrapers override to false when out-of-stock is detected
    seller: null,
    sellerRating: null,
    rating: null,
    reviewCount: null,
    deliveryInfo: null,
    returnPolicy: null,
    image: null,
    extractedVia: "none",
    error: null,
    scrapedAt: new Date().toISOString(),
  };
}
