/**
 * Shared type definitions for the SmartCompare backend.
 * Enterprise-grade price intelligence system.
 */

// --- Inbound from extension ---

export interface DetectedProductInput {
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

// --- Database Entities ---

export interface ProductEntity {
  id: string;
  brand: string | null;
  model: string | null;
  gtin: string | null;
  asin: string | null;
  canonical_title: string;
  category: string | null;
  subcategory: string | null;
  image: string | null;
  specs: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductListingEntity {
  id: string;
  product_id: string;
  store: string;
  external_id: string | null;
  url: string;
  title: string;
  seller_id: string | null;
  last_price: number | null;
  original_price: number | null;
  currency: string;
  condition: string;
  in_stock: boolean;
  delivery_info: string | null;
  return_policy: string | null;
  rating: number | null;
  review_count: number | null;
  affiliate_url: string | null;
  affiliate_network: string | null;
  last_checked: string;
  created_at: string;
}

export interface PriceHistoryEntity {
  id: string;
  listing_id: string;
  product_id: string;
  store: string;
  price: number;
  currency: string;
  recorded_at: string;
}

export interface SellerEntity {
  id: string;
  name: string;
  platform: string;
  trust_score: number;
  verified: boolean;
}

// --- Extension API Response Types ---

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

export interface IdentifyResponse {
  productId: string;
  canonicalTitle: string;
  brand: string | null;
  category: string | null;
  listings: ProductListing[];
  /** Search URLs for stores where no direct listing was found */
  searchLinks: SearchLink[];
  matched: boolean;
}

export interface SearchLink {
  platform: string;
  displayName: string;
  url: string;
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

// ============================================================
// Frontend-compatible types (smart-compare-pro)
// These are the canonical response shapes the frontend expects.
// ============================================================

export interface FrontendProduct {
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

export interface FrontendProductSearchResult {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  similarity: number;
}

export interface FrontendProductListing {
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

export interface FrontendPriceHistoryPoint {
  id: string;
  product_id: string;
  listing_id: string;
  price: number;
  recorded_at: string;
}

export interface FrontendDeal {
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

export interface FrontendWatchlistItem {
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

export interface FrontendNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

export interface AffiliateClickRecord {
  id: string;
  user_id: string | null;
  listing_id: string;
  product_id: string;
  store: string;
  affiliate_network: string | null;
  clicked_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatContext {
  product: string;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  store: string;
  dealScore: number;
  sellerTrust: number;
  priceHistory: string;
  alternatives: { name: string; price: number; store: string }[];
}
