/**
 * SmartCompare Backend API Client
 *
 * Communicates with the backend server for:
 * - Product identification and matching
 * - Cross-platform price comparison
 * - Price history retrieval
 *
 * All calls are routed through the background service worker using
 * chrome.runtime.sendMessage. This keeps the backend URL and any
 * auth tokens out of content scripts.
 *
 * When the background worker or backend is unavailable (web/demo mode),
 * functions gracefully return null so the UI can fall back.
 */

import { DetectedProduct } from "../detectors/types";

declare var chrome: any;

const isExtension =
  typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage;

// --- Response Types ---

export interface IdentifyResponse {
  productId: string;
  canonicalTitle: string;
  brand: string | null;
  category: string | null;
  listings: ProductListing[];
  matched: boolean;
}

export interface ProductListing {
  platform: string;
  externalId: string | null;
  title: string;
  price: number;
  currency: string;
  url: string;
  seller: string;
  sellerTrustScore: number;
  condition: string;
  inStock: boolean;
  lastUpdated: string;
}

export interface CompareResponse {
  currentListing: ProductListing | null;
  competitors: ProductListing[];
  priceStats: {
    lowest: number;
    highest: number;
    average: number;
    lowestPlatform: string;
  };
}

export interface PriceHistoryResponse {
  productId: string;
  history: Array<{
    timestamp: number;
    price: number;
    vendor: string;
  }>;
  stats: {
    allTimeLow: number;
    allTimeHigh: number;
    avg30d: number;
    trend: "up" | "down" | "stable";
  };
}

// --- Internal helper ---

/**
 * Send a message to the background worker and return the response.
 * Resolves to null if the extension runtime is unavailable.
 */
function sendToBackground<T>(action: string, payload?: any): Promise<T | null> {
  if (!isExtension) {
    console.info(
      "[SmartCompare] Not in extension context — backend call skipped.",
    );
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ action, payload }, (response: any) => {
        if (chrome.runtime.lastError) {
          console.warn(
            "[SmartCompare] Background message failed:",
            chrome.runtime.lastError.message,
          );
          resolve(null);
          return;
        }
        // The proxy returns { error, offline } on failure
        if (response && response.error) {
          console.warn(`[SmartCompare] Backend proxy error: ${response.error}`);
          resolve(null);
          return;
        }
        resolve(response as T);
      });
    } catch (err) {
      console.warn("[SmartCompare] sendMessage threw:", err);
      resolve(null);
    }
  });
}

// --- API Functions ---

/**
 * Sends detected product data to the backend for identification and matching.
 * Returns matched product with cross-platform listings, or null if backend is unavailable.
 */
export async function identifyProduct(
  detected: DetectedProduct,
): Promise<IdentifyResponse | null> {
  return sendToBackground<IdentifyResponse>("BACKEND_IDENTIFY_PRODUCT", {
    title: detected.title,
    price: detected.price,
    currency: detected.currency,
    platform: detected.platform,
    externalId: detected.externalId,
    gtin: detected.gtin,
    brand: detected.brand,
    image: detected.image,
    url: detected.url,
  });
}

/**
 * Fetches cross-platform price comparison for a matched product.
 */
export async function getComparisons(
  productId: string,
  currentPlatform?: string,
): Promise<CompareResponse | null> {
  return sendToBackground<CompareResponse>("BACKEND_COMPARE_PRODUCT", {
    productId,
    currentPlatform,
  });
}

/**
 * Fetches price history for a specific product.
 */
export async function getPriceHistory(
  productId: string,
  platform?: string,
): Promise<PriceHistoryResponse | null> {
  return sendToBackground<PriceHistoryResponse>("BACKEND_PRICE_HISTORY", {
    productId,
    platform,
  });
}

/**
 * Health check — useful for UI to show online/offline status.
 */
export async function checkBackendHealth(): Promise<boolean> {
  const result = await sendToBackground<{ status: string }>("BACKEND_HEALTH");
  return result?.status === "ok";
}
