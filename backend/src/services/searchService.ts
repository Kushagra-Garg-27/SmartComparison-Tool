/**
 * Search Discovery Service — finds real product pages across retailers.
 *
 * Supports multiple search API providers:
 *   1. Serper.dev  (default, SEARCH_PROVIDER=serper)
 *   2. SerpAPI     (SEARCH_PROVIDER=serpapi)
 *   3. Brave       (SEARCH_PROVIDER=brave)
 *
 * When no SEARCH_API_KEY is configured, falls back to generating
 * deterministic search-page URLs (the previous stub behaviour)
 * so the backend always returns useful data.
 *
 * Usage:
 *   const search = new SearchService();
 *   const results = await search.discoverListings({
 *     title: "Apple iPhone 16 128GB",
 *     brand: "Apple",
 *     model: "iPhone 16",
 *   });
 */

import { config } from "../config.js";

// --- Public types ---

export interface SearchQuery {
  platform: string;
  site: string;
  query: string;
}

export interface DiscoveredListing {
  platform: string;
  title: string;
  url: string;
  snippet: string;
  price: number | null; // extracted from snippet when possible
  discoveredVia: "search-api" | "fallback";
}

export interface DiscoveryInput {
  title: string;
  brand: string | null;
  model: string | null;
  gtin: string | null;
  currentPlatform?: string; // exclude the platform the user is already on
}

// --- Platform configuration ---

interface PlatformConfig {
  site: string; // site: filter domain
  name: string; // display name
  searchUrl: string; // fallback search URL template ($Q = encoded query)
}

const PLATFORMS: PlatformConfig[] = [
  {
    site: "amazon.com",
    name: "Amazon",
    searchUrl: "https://www.amazon.com/s?k=$Q",
  },
  {
    site: "bestbuy.com",
    name: "BestBuy",
    searchUrl: "https://www.bestbuy.com/site/searchpage.jsp?st=$Q",
  },
  {
    site: "walmart.com",
    name: "Walmart",
    searchUrl: "https://www.walmart.com/search?q=$Q",
  },
  {
    site: "ebay.com",
    name: "eBay",
    searchUrl: "https://www.ebay.com/sch/i.html?_nkw=$Q",
  },
  {
    site: "flipkart.com",
    name: "Flipkart",
    searchUrl: "https://www.flipkart.com/search?q=$Q",
  },
];

// --- Helpers ---

/** Build a concise search query string from product info. */
function buildQueryText(input: DiscoveryInput): string {
  const parts: string[] = [];
  if (input.brand) parts.push(input.brand);
  if (input.model) {
    parts.push(input.model);
  } else {
    // Use title minus brand to avoid duplication
    let title = input.title;
    if (input.brand)
      title = title.replace(new RegExp(input.brand, "gi"), "").trim();
    parts.push(title);
  }
  // If we have GTIN, append it for precision
  if (input.gtin) parts.push(input.gtin);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Try to extract a price number from a search snippet. */
function extractPriceFromSnippet(snippet: string): number | null {
  // Match patterns like $799.00, $799, ₹79,999 etc.
  const match = snippet.match(/[\$₹£€]\s?([\d,]+(?:\.\d{2})?)/);
  if (match) {
    const cleaned = match[1].replace(/,/g, "");
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > 0 && num < 100000) return num;
  }
  return null;
}

/** Determine if a URL is a product detail page (not a search/category page). */
function isProductPageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  // Reject search/category URLs
  if (lower.includes("/s?k=")) return false; // Amazon search
  if (lower.includes("/search?")) return false; // Generic search
  if (lower.includes("searchpage.jsp")) return false; // BestBuy search
  if (lower.includes("/sch/i.html")) return false; // eBay search
  if (lower.includes("/gp/browse")) return false; // Amazon browse
  if (lower.includes("/b/")) return false; // Category pages
  // Accept known product page patterns
  if (lower.includes("/dp/")) return true; // Amazon
  if (lower.includes("/ip/")) return true; // Walmart
  if (lower.includes("/itm/")) return true; // eBay
  if (lower.includes("/site/") && lower.includes(".p?")) return true; // BestBuy
  if (lower.includes("/product/")) return true; // Generic
  if (lower.includes("/p/")) return true; // Flipkart, others
  // Allow if it has a path with at least 2 segments (likely a product page)
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    return segments.length >= 2;
  } catch {
    return false;
  }
}

/** Map a URL domain to our standard platform name. */
function urlToPlatform(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const p of PLATFORMS) {
      if (host.includes(p.site.replace("www.", ""))) return p.name;
    }
  } catch {
    /* ignore */
  }
  return null;
}

// --- Search API Providers ---

interface RawSearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Serper.dev — Google Search API
 * https://serper.dev/
 */
async function searchViaSerper(
  query: string,
  apiKey: string,
): Promise<RawSearchResult[]> {
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      num: 5,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Serper API ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as any;
  const organic: any[] = data.organic || [];
  return organic.map((r: any) => ({
    title: r.title || "",
    url: r.link || "",
    snippet: r.snippet || "",
  }));
}

/**
 * SerpAPI — Google Search API
 * https://serpapi.com/
 */
async function searchViaSerpApi(
  query: string,
  apiKey: string,
): Promise<RawSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    api_key: apiKey,
    engine: "google",
    num: "5",
  });

  const response = await fetch(`https://serpapi.com/search?${params}`, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`SerpAPI ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as any;
  const organic: any[] = data.organic_results || [];
  return organic.map((r: any) => ({
    title: r.title || "",
    url: r.link || "",
    snippet: r.snippet || "",
  }));
}

/**
 * Brave Search API
 * https://brave.com/search/api/
 */
async function searchViaBrave(
  query: string,
  apiKey: string,
): Promise<RawSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    count: "5",
  });

  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${params}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": apiKey,
      },
      signal: AbortSignal.timeout(8000),
    },
  );

  if (!response.ok) {
    throw new Error(`Brave API ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as any;
  const results: any[] = data.web?.results || [];
  return results.map((r: any) => ({
    title: r.title || "",
    url: r.url || "",
    snippet: r.description || "",
  }));
}

// Provider dispatcher
async function executeSearch(query: string): Promise<RawSearchResult[]> {
  const apiKey = config.searchApiKey;
  const provider = config.searchProvider;

  if (!apiKey) return []; // No API key → empty results (caller will fallback)

  switch (provider) {
    case "serper":
      return searchViaSerper(query, apiKey);
    case "serpapi":
      return searchViaSerpApi(query, apiKey);
    case "brave":
      return searchViaBrave(query, apiKey);
    default:
      console.warn(
        `[SearchService] Unknown provider "${provider}", using serper`,
      );
      return searchViaSerper(query, apiKey);
  }
}

// --- Main Service ---

export class SearchService {
  /**
   * Build the per-platform search queries for a product.
   */
  buildQueries(input: DiscoveryInput): SearchQuery[] {
    const baseQuery = buildQueryText(input);
    const exclude = (input.currentPlatform || "").toLowerCase();

    return PLATFORMS.filter((p) => p.name.toLowerCase() !== exclude).map(
      (p) => ({
        platform: p.name,
        site: p.site,
        query: `site:${p.site} ${baseQuery}`,
      }),
    );
  }

  /**
   * Discover real competitor listings across platforms using a search API.
   *
   * Falls back to deterministic search-page URLs when no API key is set,
   * so the backend always returns useful comparison data.
   */
  async discoverListings(input: DiscoveryInput): Promise<DiscoveredListing[]> {
    const queries = this.buildQueries(input);
    const hasApiKey = !!config.searchApiKey;

    if (!hasApiKey) {
      console.info(
        "[SearchService] No SEARCH_API_KEY — returning fallback search URLs",
      );
      return this.fallbackListings(input, queries);
    }

    // Fire all platform searches concurrently
    const results = await Promise.allSettled(
      queries.map(async (q): Promise<DiscoveredListing | null> => {
        try {
          const raw = await executeSearch(q.query);
          // Pick the best product-page result
          const best = this.pickBestResult(raw, q.platform);
          if (best) return best;

          // If site: query didn't yield a good product page, try without site: filter
          const baseQuery = buildQueryText(input);
          const fallbackRaw = await executeSearch(`${q.platform} ${baseQuery}`);
          const fallbackBest = this.pickBestResult(fallbackRaw, q.platform);
          if (fallbackBest) return fallbackBest;

          // Last resort: return a search-page URL
          return this.makeFallbackListing(q, input);
        } catch (err) {
          console.error(
            `[SearchService] ${q.platform} search failed:`,
            (err as Error).message,
          );
          return this.makeFallbackListing(q, input);
        }
      }),
    );

    const listings: DiscoveredListing[] = [];
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        listings.push(r.value);
      }
    }

    return listings;
  }

  /**
   * From raw search results, pick the top result that's actually a product detail page
   * on the expected platform.
   */
  private pickBestResult(
    results: RawSearchResult[],
    expectedPlatform: string,
  ): DiscoveredListing | null {
    for (const r of results) {
      const platform = urlToPlatform(r.url);
      if (!platform) continue;
      if (platform !== expectedPlatform) continue;
      if (!isProductPageUrl(r.url)) continue;

      return {
        platform,
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        price: extractPriceFromSnippet(r.snippet),
        discoveredVia: "search-api",
      };
    }

    // Accept any result on the correct platform even if it's not a perfect product page
    for (const r of results) {
      const platform = urlToPlatform(r.url);
      if (platform === expectedPlatform) {
        return {
          platform,
          title: r.title,
          url: r.url,
          snippet: r.snippet,
          price: extractPriceFromSnippet(r.snippet),
          discoveredVia: "search-api",
        };
      }
    }

    return null;
  }

  /** Build a search-page fallback URL (no API required). */
  private makeFallbackListing(
    query: SearchQuery,
    input: DiscoveryInput,
  ): DiscoveredListing {
    const q = encodeURIComponent(buildQueryText(input));
    const platformConfig = PLATFORMS.find((p) => p.name === query.platform)!;
    return {
      platform: query.platform,
      title: `${input.title} — Search on ${query.platform}`,
      url: platformConfig.searchUrl.replace("$Q", q),
      snippet: "",
      price: null,
      discoveredVia: "fallback",
    };
  }

  /** Generate fallback listings for all platforms (no API call needed). */
  private fallbackListings(
    input: DiscoveryInput,
    queries: SearchQuery[],
  ): DiscoveredListing[] {
    return queries.map((q) => this.makeFallbackListing(q, input));
  }
}
