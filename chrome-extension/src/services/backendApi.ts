/**
 * API service for communicating with the SmartCompare backend.
 * Used by the background service worker (no DOM access).
 */

import type {
  DetectedProduct,
  IdentifyResponse,
  CompareResponse,
  PriceHistoryResponse,
} from "../types.js";

const API_BASE = "http://localhost:3001";

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Attach auth token from storage if available
  const stored = await chrome.storage.local.get("authToken");
  if (stored.authToken) {
    headers["Authorization"] = `Bearer ${stored.authToken}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const msg = String((err as Error | undefined)?.message || err);
    throw new Error(
      `Failed to reach backend at ${API_BASE}. ${msg}. ` +
        `If the server is running, ensure the extension has host_permissions for http://localhost:3001/* and reload the extension.`,
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error || err?.message || `API request failed (${res.status})`,
    );
  }
  return res.json();
}

export const backendApi = {
  /** Identify a detected product and get canonical info + listings */
  identify(product: DetectedProduct): Promise<IdentifyResponse> {
    return request<IdentifyResponse>("POST", "/api/product/identify", product);
  },

  /** Get cross-platform comparison for a known product */
  compare(
    productId: string,
    currentPlatform?: string,
  ): Promise<CompareResponse> {
    return request<CompareResponse>("POST", "/api/product/compare", {
      productId,
      currentPlatform,
    });
  },

  /** Get price history for charts */
  getHistory(productId: string): Promise<PriceHistoryResponse> {
    return request<PriceHistoryResponse>(
      "GET",
      `/api/product/history?productId=${encodeURIComponent(productId)}`,
    );
  },

  /** Health check */
  health(): Promise<{ status: string }> {
    return request<{ status: string }>("GET", "/health");
  },
};
