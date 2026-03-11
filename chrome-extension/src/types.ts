/**
 * Shared type definitions for the SmartCompare Chrome Extension.
 * Mirrors the backend DetectedProductInput and response types.
 */

export interface DetectedProduct {
  title: string;
  price: number | null;
  currency: string;
  platform: string;
  externalId: string | null;
  gtin: string | null;
  brand: string | null;
  image: string | null;
  url: string;
}

export interface ProductListing {
  store: string;
  storeDisplayName?: string;
  externalId: string | null;
  title: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  url: string;
  seller: string;
  sellerTrustScore: number;
  condition: string;
  inStock: boolean;
  lastUpdated: string;
  deliveryInfo: string | null;
  returnPolicy: string | null;
  rating: number | null;
  reviewCount: number | null;
  storeTrustScore: number;
}

export interface PriceStats {
  lowest: number;
  highest: number;
  average: number;
  median: number;
  lowestStore: string;
  highestStore: string;
  priceRange: number;
  savingsFromHighest: number;
  savingsPercent: number;
  listingCount: number;
  /* Legacy compat */
  lowestPlatform?: string;
}

export interface AnalyticsData {
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  medianPrice: number;
  volatility: number;
  trend: "up" | "down" | "stable";
  trendStrength: number;
  priceChangePct: number;
  recentDrop: boolean;
  storeRankings: Array<{ store: string; price: number; trustScore: number }>;
}

export interface AIRecommendation {
  action: "BUY" | "WAIT" | "NEUTRAL";
  confidence: number;
  summary: string;
  insights: Array<{ title: string; description: string; type: string }>;
  expectedDrop: number | null;
  expectedDropPercent: number | null;
  dealQuality: "excellent" | "good" | "fair" | "poor";
  factors: Array<{ factor: string; impact: string; weight: number }>;
}

export interface SearchLink {
  platform: string;
  displayName: string;
  url: string;
}

export interface IdentifyResponse {
  productId: string;
  canonicalTitle: string;
  brand: string | null;
  category: string | null;
  listings: ProductListing[];
  /** Search URLs for stores where no direct listing was found */
  searchLinks?: SearchLink[];
  matched: boolean;
  priceStats: PriceStats | null;
  analytics: AnalyticsData | null;
  recommendation: AIRecommendation | null;
  metadata: {
    storesCovered: string[];
    scrapedAt: string;
    cacheHit: boolean;
  } | null;
}

export interface CompareResponse {
  currentListing: ProductListing | null;
  competitors: ProductListing[];
  priceStats: PriceStats;
}

export interface PriceHistoryPoint {
  timestamp: number;
  price: number;
  vendor: string;
}

export interface PriceHistoryResponse {
  productId: string;
  history: PriceHistoryPoint[];
  stats: {
    allTimeLow: number;
    allTimeHigh: number;
    avg30d: number;
    trend: "up" | "down" | "stable";
  };
}

/** Messages passed between content script ↔ background ↔ popup/panel */
export type ExtensionMessage =
  | { type: "PRODUCT_DETECTED"; payload: DetectedProduct }
  | { type: "GET_DETECTED_PRODUCT" }
  | { type: "IDENTIFY_PRODUCT"; payload: DetectedProduct }
  | { type: "COMPARE_PRODUCT"; payload: { productId: string; currentPlatform?: string } }
  | { type: "GET_PRICE_HISTORY"; payload: { productId: string } }
  | { type: "OPEN_SIDE_PANEL" };

export type ExtensionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
