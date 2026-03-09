/**
 * Shared type definitions for the SmartCompare backend.
 * These mirror/extend the extension-side DetectedProduct type.
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
  canonical_title: string;
  category: string | null;
  image: string | null;
  created_at: string;
}

export interface ProductListingEntity {
  id: string;
  product_id: string;
  platform: string;
  external_id: string | null;
  url: string;
  title: string;
  seller_id: string | null;
  last_price: number | null;
  currency: string;
  condition: string;
  in_stock: boolean;
  last_checked: string;
}

export interface PriceHistoryEntity {
  id: string;
  listing_id: string;
  price: number;
  currency: string;
  recorded_at: string;
}

export interface SellerEntity {
  id: string;
  name: string;
  platform: string;
  trust_score: number;
}

// --- API Response Types ---

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
  matched: boolean;
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
