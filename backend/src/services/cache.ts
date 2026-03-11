/**
 * Cache Layer — Intelligent caching with TTL for price data.
 *
 * Provides a Redis-compatible interface using in-memory storage OR Upstash Redis.
 * Automatically selects Redis when UPSTASH_REDIS_REST_URL is configured.
 *
 * Default TTL: 10 minutes for price data, 5 minutes for search results.
 */

import { config } from "../config.js";

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

/** Default TTLs in milliseconds */
export const CacheTTL = {
  /** Store listings: 30 minutes (increased for production) */
  LISTINGS: 30 * 60 * 1000,
  /** Search results: 10 minutes */
  SEARCH: 10 * 60 * 1000,
  /** Product identification: 60 minutes */
  PRODUCT_ID: 60 * 60 * 1000,
  /** Price analytics: 15 minutes */
  ANALYTICS: 15 * 60 * 1000,
  /** AI recommendations: 20 minutes */
  AI_RECOMMENDATION: 20 * 60 * 1000,
  /** Scraper results: 30 minutes */
  SCRAPER: 30 * 60 * 1000,
  /** Adapter results: 30 minutes */
  ADAPTER: 30 * 60 * 1000,
} as const;

/** Cache key generators for consistent naming */
export const CacheKeys = {
  productListings: (productId: string) => `listings:${productId}`,
  storePrice: (productId: string, store: string) =>
    `price:${productId}:${store}`,
  productIdentify: (title: string, store: string) =>
    `identify:${store}:${normalizeForKey(title)}`,
  searchResults: (query: string) => `search:${normalizeForKey(query)}`,
  priceAnalytics: (productId: string) => `analytics:${productId}`,
  aiRecommendation: (productId: string) => `ai:${productId}`,
  aggregation: (productId: string) => `aggregation:${productId}`,
  scraperResult: (store: string, url: string) =>
    `scraper:${store}:${normalizeForKey(url)}`,
} as const;

function normalizeForKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .substring(0, 100);
}

/**
 * In-memory cache provider with TTL and automatic cleanup.
 * Suitable for single-instance deployments.
 * Replace with RedisCacheProvider for multi-instance setups.
 */
export class MemoryCacheProvider implements CacheProvider {
  private cache = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs = 60_000) {
    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(
    key: string,
    value: T,
    ttlMs: number = CacheTTL.LISTINGS,
  ): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    if (!pattern) return allKeys;

    // Simple glob-like matching (supports * wildcard)
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$",
    );
    return allKeys.filter((key) => regex.test(key));
  }

  /** Get cache stats for monitoring */
  getStats(): { size: number; hitRate: string } {
    this.cleanup();
    return {
      size: this.cache.size,
      hitRate: "N/A", // Would track in production
    };
  }

  /** Remove expired entries */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /** Stop the cleanup interval (for graceful shutdown) */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

/**
 * Upstash Redis cache provider.
 * Uses the REST API for serverless-compatible distributed caching.
 */
export class RedisCacheProvider implements CacheProvider {
  private redis: import("@upstash/redis").Redis | null = null;

  constructor() {
    // Lazy-init to avoid import issues at top level
  }

  private async getRedis() {
    if (!this.redis) {
      const { Redis } = await import("@upstash/redis");
      this.redis = new Redis({
        url: config.upstashRedisRestUrl,
        token: config.upstashRedisRestToken,
      });
    }
    return this.redis;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = await this.getRedis();
      const value = await redis.get<T>(key);
      return value ?? null;
    } catch (err) {
      console.warn("[RedisCacheProvider] GET failed:", err);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlMs: number = CacheTTL.LISTINGS,
  ): Promise<void> {
    try {
      const redis = await this.getRedis();
      const ttlSeconds = Math.ceil(ttlMs / 1000);
      await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
    } catch (err) {
      console.warn("[RedisCacheProvider] SET failed:", err);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const redis = await this.getRedis();
      await redis.del(key);
    } catch (err) {
      console.warn("[RedisCacheProvider] DEL failed:", err);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const redis = await this.getRedis();
      const exists = await redis.exists(key);
      return exists === 1;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const redis = await this.getRedis();
      await redis.flushdb();
    } catch (err) {
      console.warn("[RedisCacheProvider] FLUSHDB failed:", err);
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    try {
      const redis = await this.getRedis();
      if (!pattern) {
        return await redis.keys("*");
      }
      // Convert simple glob to Redis pattern
      return await redis.keys(pattern);
    } catch {
      return [];
    }
  }
}

/** Singleton cache instance — uses Redis when configured, falls back to memory */
export const cache: CacheProvider =
  config.upstashRedisRestUrl && config.upstashRedisRestToken
    ? new RedisCacheProvider()
    : new MemoryCacheProvider();
