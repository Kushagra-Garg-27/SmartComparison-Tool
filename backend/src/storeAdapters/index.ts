/**
 * Store Adapter Registry — Central registry for all store adapters.
 *
 * Provides a unified interface to search across all registered stores
 * with concurrency control and error resilience.
 */

import type { BaseStoreAdapter, StoreListing, AdapterSearchOptions } from "./baseAdapter.js";
import { AmazonAdapter } from "./amazonAdapter.js";
import { FlipkartAdapter } from "./flipkartAdapter.js";
import { EbayAdapter } from "./ebayAdapter.js";
import { WalmartAdapter } from "./walmartAdapter.js";
import { BestBuyAdapter } from "./bestbuyAdapter.js";
import { TargetAdapter } from "./targetAdapter.js";
import { NeweggAdapter } from "./neweggAdapter.js";
import {
  titleSimilarity,
  buildSearchQueryFromFingerprint,
  fingerprintSimilarity,
  normalizeProduct,
  type ProductFingerprint,
} from "../services/productNormalizer.js";

/* ------------------------------------------------------------------ */
/* Concurrency control                                                 */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Cross-marketplace search engine                                     */
/* ------------------------------------------------------------------ */

export interface CrossMarketSearchResult {
  listings: StoreListing[];
  errors: Array<{ store: string; error: string }>;
  stats: {
    storesSearched: number;
    storesResponded: number;
    totalListings: number;
    searchTimeMs: number;
  };
}

/** Minimum relevance score to include a listing in results */
const RELEVANCE_THRESHOLD = 0.3;

export class AdapterRegistry {
  private adapters = new Map<string, BaseStoreAdapter>();
  private semaphore: Semaphore;

  constructor(maxConcurrency = 4) {
    this.semaphore = new Semaphore(maxConcurrency);
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register(new AmazonAdapter());
    this.register(new FlipkartAdapter());
    this.register(new EbayAdapter());
    this.register(new WalmartAdapter());
    this.register(new BestBuyAdapter());
    this.register(new TargetAdapter());
    this.register(new NeweggAdapter());
  }

  register(adapter: BaseStoreAdapter): void {
    this.adapters.set(adapter.storeId, adapter);
  }

  get(storeId: string): BaseStoreAdapter | undefined {
    return this.adapters.get(storeId);
  }

  getAll(): BaseStoreAdapter[] {
    return Array.from(this.adapters.values());
  }

  getRegisteredIds(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Cross-Marketplace Search Engine.
   *
   * Given a product fingerprint, searches all registered stores in parallel,
   * scores results for relevance, and returns the best listings.
   */
  async searchAllStores(
    fingerprint: ProductFingerprint,
    originalTitle: string,
    excludeStoreId?: string,
    options?: { limit?: number; timeout?: number },
  ): Promise<CrossMarketSearchResult> {
    const startTime = Date.now();
    const limit = options?.limit ?? 3;
    const timeout = options?.timeout ?? 15000;

    // Build the optimized search query from fingerprint
    const searchQuery = buildSearchQueryFromFingerprint(fingerprint);
    if (!searchQuery || searchQuery.length < 3) {
      // Fallback: use key words from original title
      const fallbackQuery = originalTitle
        .split(/\s+/)
        .filter(w => w.length > 2 && !FILLER_WORDS.has(w.toLowerCase()))
        .slice(0, 6)
        .join(" ");
      return this.executeSearch(fallbackQuery || originalTitle, fingerprint, originalTitle, excludeStoreId, limit, timeout, startTime);
    }

    return this.executeSearch(searchQuery, fingerprint, originalTitle, excludeStoreId, limit, timeout, startTime);
  }

  private async executeSearch(
    searchQuery: string,
    fingerprint: ProductFingerprint,
    originalTitle: string,
    excludeStoreId: string | undefined,
    limit: number,
    timeout: number,
    startTime: number,
  ): Promise<CrossMarketSearchResult> {
    const allListings: StoreListing[] = [];
    const errors: Array<{ store: string; error: string }> = [];
    let storesSearched = 0;
    let storesResponded = 0;

    // Create an abort controller for global timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const tasks = Array.from(this.adapters.entries())
      .filter(([id]) => id !== excludeStoreId)
      .map(async ([storeId, adapter]) => {
        storesSearched++;
        await this.semaphore.acquire();
        try {
          if (controller.signal.aborted) return;

          const results = await adapter.searchProducts(searchQuery, {
            limit,
            fingerprint,
          });

          // Score each result for relevance
          for (const listing of results) {
            listing.relevanceScore = this.scoreRelevance(listing, fingerprint, originalTitle);
          }

          // Filter by threshold and sort by relevance
          const relevant = results
            .filter(l => l.relevanceScore >= RELEVANCE_THRESHOLD)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);

          if (results.length > 0 && relevant.length === 0) {
            console.info(`[AdapterRegistry] ${storeId}: ${results.length} raw results, all below relevance threshold (best: ${Math.max(...results.map(r => r.relevanceScore)).toFixed(2)})`);
          } else if (results.length === 0) {
            console.info(`[AdapterRegistry] ${storeId}: 0 raw results (empty response)`);
          }

          allListings.push(...relevant);
          if (relevant.length > 0) storesResponded++;
        } catch (err) {
          errors.push({
            store: storeId,
            error: err instanceof Error ? err.message : String(err),
          });
        } finally {
          this.semaphore.release();
        }
      });

    await Promise.allSettled(tasks);
    clearTimeout(timer);

    // Sort all listings by price
    allListings.sort((a, b) => a.price - b.price);

    return {
      listings: allListings,
      errors,
      stats: {
        storesSearched,
        storesResponded,
        totalListings: allListings.length,
        searchTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Score how relevant a listing is to the original product.
   * Combines fingerprint matching with title similarity.
   */
  private scoreRelevance(
    listing: StoreListing,
    fingerprint: ProductFingerprint,
    originalTitle: string,
  ): number {
    // Build a fingerprint from the listing title
    const listingNorm = normalizeProduct(listing.title);
    const listingFp = listingNorm.fingerprint;

    // Fingerprint-based matching (60% weight)
    const fpScore = fingerprintSimilarity(fingerprint, listingFp);

    // Title similarity (40% weight)
    const titleScore = titleSimilarity(originalTitle, listing.title);

    return fpScore * 0.6 + titleScore * 0.4;
  }
}

const FILLER_WORDS = new Set([
  "buy", "online", "best", "price", "offer", "sale", "discount", "off",
  "new", "latest", "the", "for", "with", "and", "from", "shop",
]);

/** Singleton adapter registry */
export const adapterRegistry = new AdapterRegistry();
