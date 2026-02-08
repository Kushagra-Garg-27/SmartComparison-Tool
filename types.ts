
export interface Product {
  id: string;
  externalId?: string; // ASIN, Item ID, SKU, etc.
  title: string;
  price: number;
  currency: string;
  vendor: string;
  image: string;
  rating: number;
  reviewCount: number;
  condition: 'New' | 'Refurbished' | 'Used';
  shipping: string;
  sellerTrustScore: number; // 0 to 100
  url: string;
  platform: 'Amazon' | 'eBay' | 'BestBuy' | 'Walmart' | 'Direct';
  priceTrend?: 'up' | 'down' | 'stable';
  averagePrice?: number;
  verificationStatus?: 'verified' | 'unverified' | 'searching' | 'failed';
  isAlternative?: boolean; // Indicates if this product was found as a fallback for an invalid link
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  text: string;
  date: string;
}

export interface Alternative {
  title: string;
  price: number;
  reason: string;
}

export interface AnalysisResult {
  bestPriceId: string;
  bestValueId: string;
  trustWarningId: string | null;
  summary: string;
  recommendation: string;
  pros: string[];
  cons: string[];
  alternatives: Alternative[];
}

export enum ViewState {
  HIDDEN,
  MINIMIZED,
  EXPANDED
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface PricePoint {
  timestamp: number; // Unix timestamp
  price: number;
  vendor: string;
}
