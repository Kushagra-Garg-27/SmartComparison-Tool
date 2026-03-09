/**
 * In-memory data store for development.
 *
 * Provides the same data model as the PostgreSQL schema but keeps everything
 * in process memory. This allows the backend to compile, run and serve the
 * extension immediately — no database setup required.
 *
 * When USE_MEMORY_STORE=false, the service layer will use PostgreSQL instead.
 */

import crypto from "crypto";

// --- Internal storage types ---

interface StoredProduct {
  id: string;
  brand: string | null;
  model: string | null;
  gtin: string | null;
  canonicalTitle: string;
  category: string | null;
  image: string | null;
  createdAt: string;
}

interface StoredListing {
  id: string;
  productId: string;
  platform: string;
  externalId: string | null;
  url: string;
  title: string;
  sellerId: string | null;
  lastPrice: number | null;
  currency: string;
  condition: string;
  inStock: boolean;
  lastChecked: string;
}

interface StoredPricePoint {
  id: string;
  listingId: string;
  price: number;
  currency: string;
  recordedAt: string;
}

interface StoredSeller {
  id: string;
  name: string;
  platform: string;
  trustScore: number;
}

function uuid(): string {
  return crypto.randomUUID();
}

export class MemoryStore {
  products: Map<string, StoredProduct> = new Map();
  listings: Map<string, StoredListing> = new Map();
  priceHistory: Map<string, StoredPricePoint> = new Map();
  sellers: Map<string, StoredSeller> = new Map();

  // Indexes
  private gtinIndex: Map<string, string> = new Map(); // gtin → productId
  private listingsByProduct: Map<string, Set<string>> = new Map(); // productId → listing ids
  private historyByListing: Map<string, string[]> = new Map(); // listingId → history ids

  // --- Products ---

  findProductByGtin(gtin: string): StoredProduct | null {
    const pid = this.gtinIndex.get(gtin);
    return pid ? this.products.get(pid) || null : null;
  }

  findProductByTitleBrand(
    title: string,
    brand: string | null,
  ): StoredProduct | null {
    const titleLower = title.toLowerCase();
    for (const p of this.products.values()) {
      const pTitle = p.canonicalTitle.toLowerCase();
      // Simple fuzzy: check if major words overlap
      const titleWords = titleLower.split(/\s+/).filter((w) => w.length > 3);
      const matchCount = titleWords.filter((w) => pTitle.includes(w)).length;
      const matchRatio =
        titleWords.length > 0 ? matchCount / titleWords.length : 0;

      if (matchRatio > 0.6) {
        if (
          !brand ||
          !p.brand ||
          p.brand.toLowerCase() === brand.toLowerCase()
        ) {
          return p;
        }
      }
    }
    return null;
  }

  createProduct(data: {
    brand: string | null;
    model: string | null;
    gtin: string | null;
    canonicalTitle: string;
    category: string | null;
    image: string | null;
  }): StoredProduct {
    const id = uuid();
    const product: StoredProduct = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.products.set(id, product);
    if (data.gtin) this.gtinIndex.set(data.gtin, id);
    return product;
  }

  // --- Listings ---

  getListingsForProduct(productId: string): StoredListing[] {
    const ids = this.listingsByProduct.get(productId);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.listings.get(id))
      .filter(Boolean) as StoredListing[];
  }

  findListingByPlatformExternalId(
    platform: string,
    externalId: string,
  ): StoredListing | null {
    for (const l of this.listings.values()) {
      if (l.platform === platform && l.externalId === externalId) return l;
    }
    return null;
  }

  createListing(data: {
    productId: string;
    platform: string;
    externalId: string | null;
    url: string;
    title: string;
    sellerId: string | null;
    lastPrice: number | null;
    currency: string;
    condition?: string;
    inStock?: boolean;
  }): StoredListing {
    const id = uuid();
    const listing: StoredListing = {
      id,
      productId: data.productId,
      platform: data.platform,
      externalId: data.externalId,
      url: data.url,
      title: data.title,
      sellerId: data.sellerId,
      lastPrice: data.lastPrice,
      currency: data.currency,
      condition: data.condition || "New",
      inStock: data.inStock ?? true,
      lastChecked: new Date().toISOString(),
    };
    this.listings.set(id, listing);

    if (!this.listingsByProduct.has(data.productId)) {
      this.listingsByProduct.set(data.productId, new Set());
    }
    this.listingsByProduct.get(data.productId)!.add(id);

    return listing;
  }

  updateListingPrice(listingId: string, price: number): void {
    const listing = this.listings.get(listingId);
    if (listing) {
      listing.lastPrice = price;
      listing.lastChecked = new Date().toISOString();
    }
  }

  // --- Price History ---

  addPriceHistory(
    listingId: string,
    price: number,
    currency: string,
  ): StoredPricePoint {
    const id = uuid();
    const point: StoredPricePoint = {
      id,
      listingId,
      price,
      currency,
      recordedAt: new Date().toISOString(),
    };
    this.priceHistory.set(id, point);

    if (!this.historyByListing.has(listingId)) {
      this.historyByListing.set(listingId, []);
    }
    this.historyByListing.get(listingId)!.push(id);

    return point;
  }

  getHistoryForListing(listingId: string): StoredPricePoint[] {
    const ids = this.historyByListing.get(listingId) || [];
    return ids
      .map((id) => this.priceHistory.get(id))
      .filter(Boolean) as StoredPricePoint[];
  }

  getHistoryForProduct(productId: string): StoredPricePoint[] {
    const listingIds = this.listingsByProduct.get(productId);
    if (!listingIds) return [];
    const allHistory: StoredPricePoint[] = [];
    for (const lid of listingIds) {
      allHistory.push(...this.getHistoryForListing(lid));
    }
    return allHistory.sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );
  }

  // --- Sellers ---

  addSeller(data: {
    id?: string;
    name: string;
    platform: string;
    trustScore: number;
  }): StoredSeller {
    const id = data.id || uuid();
    const seller: StoredSeller = {
      id,
      name: data.name,
      platform: data.platform,
      trustScore: data.trustScore,
    };
    this.sellers.set(id, seller);
    return seller;
  }

  findSellerByPlatform(platform: string): StoredSeller | null {
    for (const s of this.sellers.values()) {
      if (s.platform === platform) return s;
    }
    return null;
  }

  getSellerById(id: string): StoredSeller | null {
    return this.sellers.get(id) || null;
  }

  // --- Bulk seed helpers ---

  /**
   * Generate synthetic price history for a listing going back N days.
   * Useful for seeding demo data so charts have something to render.
   */
  generateSyntheticHistory(
    listingId: string,
    basePrice: number,
    currency: string,
    days: number = 30,
  ): void {
    const now = Date.now();
    for (let d = days; d >= 0; d--) {
      const jitter = (Math.random() - 0.5) * basePrice * 0.08; // ±4%
      const price = Math.max(0, +(basePrice + jitter).toFixed(2));
      const point: StoredPricePoint = {
        id: uuid(),
        listingId,
        price,
        currency,
        recordedAt: new Date(now - d * 86400000).toISOString(),
      };
      this.priceHistory.set(point.id, point);
      if (!this.historyByListing.has(listingId)) {
        this.historyByListing.set(listingId, []);
      }
      this.historyByListing.get(listingId)!.push(point.id);
    }
  }
}
