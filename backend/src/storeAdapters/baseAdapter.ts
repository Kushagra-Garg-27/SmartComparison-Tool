/**
 * Base Store Adapter — Defines the universal interface all store adapters must implement.
 *
 * Each adapter is responsible for:
 * 1. Searching for products on the store
 * 2. Parsing search results into normalized StoreListing objects
 * 3. Scoring result relevance against a product fingerprint
 */

import type { ProductFingerprint } from "../services/productNormalizer.js";
import { safeFetch } from "../scrapers/base.js";

/* ------------------------------------------------------------------ */
/* Shared types                                                        */
/* ------------------------------------------------------------------ */

export interface StoreListing {
  storeId: string;
  storeName: string;
  price: number;
  currency: string;
  availability: boolean;
  rating: number | null;
  reviewCount: number | null;
  deliveryInfo: string | null;
  returnPolicy: string | null;
  storeReputation: number; // 0–100
  productUrl: string;
  title: string;
  image: string | null;
  originalPrice: number | null;
  seller: string | null;
  externalId: string | null;
  /** How well this listing matches the query (0–1) */
  relevanceScore: number;
  lastUpdated: string;
}

export interface AdapterSearchOptions {
  limit?: number;
  fingerprint?: ProductFingerprint;
}

/* ------------------------------------------------------------------ */
/* Abstract base adapter                                               */
/* ------------------------------------------------------------------ */

export abstract class BaseStoreAdapter {
  abstract readonly storeId: string;
  abstract readonly storeName: string;
  abstract readonly baseUrl: string;
  abstract readonly currency: string;
  abstract readonly trustScore: number;
  abstract readonly defaultDeliveryInfo: string;
  abstract readonly defaultReturnPolicy: string;

  /**
   * Search for products on this store by query string.
   * Returns normalized StoreListing objects.
   */
  abstract searchProducts(query: string, options?: AdapterSearchOptions): Promise<StoreListing[]>;

  /**
   * Parse a single product page into a StoreListing.
   * Optional — some adapters may only support search.
   */
  async parseListing(url: string): Promise<StoreListing | null> {
    return null;
  }

  /** Build the search URL for this store */
  abstract buildSearchUrl(query: string): string;

  /**
   * Shared HTTP fetch with retry logic, rate limiting awareness, and timeout.
   */
  protected async fetchHtml(url: string, timeoutMs = 12000, retries = 2): Promise<string> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Add small delay between retries to avoid rate limiting
        if (attempt > 0) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
        const html = await safeFetch(url, timeoutMs);
        // Detect CAPTCHA / bot-block pages
        if (this.isBlockedPage(html)) {
          throw new Error(`Store ${this.storeId} returned a CAPTCHA/block page`);
        }
        return html;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Don't retry on 4xx client errors, 503 service unavailable, or block pages
        if (lastError.message.includes("HTTP 4") || lastError.message.includes("HTTP 503") || lastError.message.includes("CAPTCHA") || lastError.message.includes("block page")) break;
      }
    }
    throw lastError ?? new Error("Fetch failed");
  }

  /**
   * Detect if the returned HTML is a CAPTCHA, bot-check, or access-denied page.
   */
  protected isBlockedPage(html: string): boolean {
    const lower = html.toLowerCase();
    const blockSignals = [
      "robot or human",
      "are you a human",
      "captcha",
      "pardon our interruption",
      "access denied",
      "please verify you are a human",
      "automated access",
      "unusual traffic",
      "sorry! something went wrong",
    ];
    // Only trigger on small pages (real product pages are >50KB)
    if (html.length < 50000) {
      for (const signal of blockSignals) {
        if (lower.includes(signal)) return true;
      }
    }
    return false;
  }

  /**
   * Create a base listing with store defaults filled in.
   */
  protected createBaseListing(
    title: string,
    price: number,
    url: string,
  ): StoreListing {
    return {
      storeId: this.storeId,
      storeName: this.storeName,
      price,
      currency: this.currency,
      availability: true,
      rating: null,
      reviewCount: null,
      deliveryInfo: this.defaultDeliveryInfo,
      returnPolicy: this.defaultReturnPolicy,
      storeReputation: this.trustScore,
      productUrl: url,
      title,
      image: null,
      originalPrice: null,
      seller: this.storeName,
      externalId: null,
      relevanceScore: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Parse a price string to number, handling various currency formats.
   */
  protected parsePrice(text: string | null | undefined): number | null {
    if (!text) return null;
    const cleaned = text.replace(/[₹$€£¥,\s]/g, "").trim();
    const match = cleaned.match(/(\d+\.?\d*)/);
    if (!match) return null;
    const value = parseFloat(match[1]);
    return isNaN(value) || value <= 0 ? null : value;
  }
}
