// Normalized API response types used across the service layer.
// These decouple UI components from the raw backend/database schema.

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  image_url: string | null;
  specs: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  similarity: number;
}

export interface ProductListing {
  id: string;
  product_id: string;
  store: string;
  current_price: number;
  original_price: number | null;
  seller_name: string | null;
  seller_rating: number | null;
  store_url: string | null;
  affiliate_url: string | null;
  affiliate_network: string | null;
  is_available: boolean | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceHistoryPoint {
  id: string;
  product_id: string;
  listing_id: string;
  price: number;
  recorded_at: string;
}

export interface Deal {
  id: string;
  product_id?: string;
  product_name: string;
  product_image: string | null;
  original_price: number;
  deal_price: number;
  discount_percent: number | null;
  deal_score: number | null;
  store: string;
  category: string | null;
  is_limited_time: boolean | null;
  expires_at: string | null;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  product_name: string;
  product_image: string | null;
  product_url: string | null;
  store: string;
  current_price: number;
  alert_price: number | null;
  trend: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

export interface AffiliateClickParams {
  userId: string | null;
  listingId: string;
  productId: string;
  store: string;
  affiliateNetwork: string | null;
}

/* ------------------------------------------------------------------ */
/* Enhanced response types from the new price intelligence backend     */
/* ------------------------------------------------------------------ */

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
  recommendation: "BUY" | "WAIT" | "NEUTRAL";
  confidence: number;
  summary: string;
  insights: string[];
  expectedDrop: number | null;
  dealQuality: "excellent" | "good" | "fair" | "poor";
  factors: Array<{ factor: string; impact: string; weight: number }>;
}

export interface EnhancedProductResponse {
  productId: string;
  canonicalTitle: string;
  brand: string | null;
  category: string | null;
  image: string | null;
  listings: ProductListing[];
  priceStats: PriceStats | null;
  analytics: AnalyticsData | null;
  recommendation: AIRecommendation | null;
  metadata: {
    storesCovered: string[];
    scrapedAt: string;
    cacheHit: boolean;
  } | null;
}

export interface StoreInfo {
  id: string;
  displayName: string;
  trustScore: number;
  currency: string;
  region: string;
  enabled: boolean;
}
