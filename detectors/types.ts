/**
 * Product data extracted from a web page by the detection pipeline.
 * Represents raw extraction output before enrichment by the backend.
 */
export interface DetectedProduct {
  title: string;
  price: number | null;
  currency: string;
  platform: string;
  externalId: string | null; // ASIN, SKU, Item ID, etc.
  gtin: string | null; // UPC/EAN/ISBN
  brand: string | null;
  image: string | null;
  url: string;
  rating: number | null;
  reviewCount: number | null;
  confidence: "high" | "medium" | "low";
}

/**
 * Interface that all platform-specific detectors must implement.
 */
export interface PlatformDetector {
  /** Display name of the platform */
  name: string;
  /** Returns true if this detector can handle the given URL */
  matchUrl(url: string): boolean;
  /** Attempts to extract product data from the page DOM */
  extract(doc: Document, url: string): DetectedProduct | null;
}
