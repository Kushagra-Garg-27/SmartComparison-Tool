/**
 * Scraper Manager — Orchestrates all store scrapers.
 *
 * Responsibilities:
 * - Maintains a registry of all available scrapers
 * - Provides a unified interface to scrape across stores
 * - Controls concurrency and rate limiting
 * - Handles errors gracefully per-store
 *
 * New scrapers are auto-registered; no core code changes needed.
 */

import type {
  StoreScraper,
  ScraperResult,
  ScraperSearchResult,
} from "./base.js";
import { AmazonScraper } from "./amazonScraper.js";
import { FlipkartScraper } from "./flipkartScraper.js";
import { CromaScraper } from "./cromaScraper.js";
import { RelianceDigitalScraper } from "./relianceDigitalScraper.js";
import { VijaySalesScraper } from "./vijaySalesScraper.js";
import { storeRegistry } from "../stores/registry.js";

/** Concurrency semaphore for rate limiting */
class Semaphore {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(private maxConcurrent: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) {
      this.running++;
      next();
    }
  }
}

export interface MultiStoreSearchResult {
  results: ScraperSearchResult[];
  errors: Array<{ store: string; error: string }>;
}

export interface MultiStoreScrapeResult {
  results: ScraperResult[];
  errors: Array<{ store: string; error: string }>;
}

export class ScraperManager {
  private scrapers = new Map<string, StoreScraper>();
  private semaphore: Semaphore;

  constructor(maxConcurrency = 3) {
    this.semaphore = new Semaphore(maxConcurrency);
    this.registerDefaultScrapers();
  }

  /** Register all built-in scrapers */
  private registerDefaultScrapers(): void {
    this.register(new AmazonScraper());
    this.register(new FlipkartScraper());
    this.register(new CromaScraper());
    this.register(new RelianceDigitalScraper());
    this.register(new VijaySalesScraper());
  }

  /** Register a new scraper */
  register(scraper: StoreScraper): void {
    this.scrapers.set(scraper.storeId, scraper);
  }

  /** Get a specific scraper */
  getScraper(storeId: string): StoreScraper | undefined {
    return this.scrapers.get(storeId);
  }

  /** Get all registered store IDs */
  getRegisteredStores(): string[] {
    return Array.from(this.scrapers.keys());
  }

  /** Scrape a single product URL */
  async scrapeProduct(
    storeId: string,
    url: string,
  ): Promise<ScraperResult | null> {
    const scraper = this.scrapers.get(storeId);
    if (!scraper) return null;

    await this.semaphore.acquire();
    try {
      return await scraper.scrapeProduct(url);
    } finally {
      this.semaphore.release();
    }
  }

  /**
   * Scrape a product across all enabled stores by searching for it.
   * Returns results from every store that found a matching product.
   */
  async scrapeAcrossStores(
    query: string,
    excludeStore?: string,
  ): Promise<MultiStoreScrapeResult> {
    const enabledStores = storeRegistry.getEnabled();
    const results: ScraperResult[] = [];
    const errors: Array<{ store: string; error: string }> = [];

    const tasks = enabledStores
      .filter((s) => s.id !== excludeStore && this.scrapers.has(s.id))
      .map(async (storeConfig) => {
        const scraper = this.scrapers.get(storeConfig.id)!;
        await this.semaphore.acquire();
        try {
          // First, search for the product on this store
          const searchResults = await scraper.searchProducts(query, 1);
          if (searchResults.length === 0) {
            return; // No results on this store
          }

          // Then scrape the top result for full details
          const productUrl = searchResults[0].url;
          const result = await scraper.scrapeProduct(productUrl);
          results.push(result);
        } catch (err) {
          errors.push({
            store: storeConfig.id,
            error: err instanceof Error ? err.message : String(err),
          });
        } finally {
          this.semaphore.release();
        }
      });

    await Promise.allSettled(tasks);

    return { results, errors };
  }

  /**
   * Search for a product across all enabled stores.
   * Returns search results without scraping individual product pages.
   */
  async searchAcrossStores(
    query: string,
    limitPerStore = 3,
    excludeStore?: string,
  ): Promise<MultiStoreSearchResult> {
    const enabledStores = storeRegistry.getEnabled();
    const results: ScraperSearchResult[] = [];
    const errors: Array<{ store: string; error: string }> = [];

    const tasks = enabledStores
      .filter((s) => s.id !== excludeStore && this.scrapers.has(s.id))
      .map(async (storeConfig) => {
        const scraper = this.scrapers.get(storeConfig.id)!;
        await this.semaphore.acquire();
        try {
          const storeResults = await scraper.searchProducts(
            query,
            limitPerStore,
          );
          results.push(...storeResults);
        } catch (err) {
          errors.push({
            store: storeConfig.id,
            error: err instanceof Error ? err.message : String(err),
          });
        } finally {
          this.semaphore.release();
        }
      });

    await Promise.allSettled(tasks);

    return { results, errors };
  }

  /**
   * Refresh prices for existing listings.
   * Takes a list of store+URL pairs and scrapes current data.
   */
  async refreshListings(
    listings: Array<{ store: string; url: string }>,
  ): Promise<MultiStoreScrapeResult> {
    const results: ScraperResult[] = [];
    const errors: Array<{ store: string; error: string }> = [];

    const tasks = listings.map(async ({ store, url }) => {
      const scraper = this.scrapers.get(store);
      if (!scraper) {
        errors.push({ store, error: `No scraper registered for store: ${store}` });
        return;
      }

      await this.semaphore.acquire();
      try {
        const result = await scraper.scrapeProduct(url);
        results.push(result);
      } catch (err) {
        errors.push({
          store,
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        this.semaphore.release();
      }
    });

    await Promise.allSettled(tasks);

    return { results, errors };
  }
}
