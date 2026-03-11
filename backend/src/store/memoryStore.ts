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
  subcategory: string | null;
  image: string | null;
  specs: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
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
  originalPrice: number | null;
  currency: string;
  condition: string;
  inStock: boolean;
  lastChecked: string;
  affiliateUrl: string | null;
  affiliateNetwork: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoredPricePoint {
  id: string;
  listingId: string;
  productId: string;
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

interface StoredDeal {
  id: string;
  productId: string | undefined;
  productName: string;
  productImage: string | null;
  originalPrice: number;
  dealPrice: number;
  discountPercent: number | null;
  dealScore: number | null;
  store: string;
  category: string | null;
  isLimitedTime: boolean | null;
  expiresAt: string | null;
  createdAt: string;
}

interface StoredWatchlistItem {
  id: string;
  userId: string;
  productName: string;
  productImage: string | null;
  productUrl: string | null;
  store: string;
  currentPrice: number;
  alertPrice: number | null;
  trend: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoredNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

interface StoredAffiliateClick {
  id: string;
  userId: string | null;
  listingId: string;
  productId: string;
  store: string;
  affiliateNetwork: string | null;
  clickedAt: string;
}

function uuid(): string {
  return crypto.randomUUID();
}

export class MemoryStore {
  products: Map<string, StoredProduct> = new Map();
  listings: Map<string, StoredListing> = new Map();
  priceHistory: Map<string, StoredPricePoint> = new Map();
  sellers: Map<string, StoredSeller> = new Map();
  deals: Map<string, StoredDeal> = new Map();
  watchlist: Map<string, StoredWatchlistItem> = new Map();
  notifications: Map<string, StoredNotification> = new Map();
  affiliateClicks: Map<string, StoredAffiliateClick> = new Map();

  // Indexes
  private gtinIndex: Map<string, string> = new Map(); // gtin → productId
  private listingsByProduct: Map<string, Set<string>> = new Map(); // productId → listing ids
  private historyByListing: Map<string, string[]> = new Map(); // listingId → history ids
  private historyByProduct: Map<string, string[]> = new Map(); // productId → history ids

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
    let bestMatch: StoredProduct | null = null;
    let bestScore = 0;

    for (const p of this.products.values()) {
      // Brand must match when both are provided
      if (brand && p.brand && p.brand.toLowerCase() !== brand.toLowerCase()) {
        continue;
      }

      const pTitle = p.canonicalTitle.toLowerCase();

      // Bidirectional fuzzy matching: check overlap in BOTH directions.
      // Use words > 2 chars to include short but significant tokens (M3, S24…)
      const inputWords = titleLower.split(/\s+/).filter((w) => w.length > 2);
      const canonicalWords = pTitle.split(/\s+/).filter((w) => w.length > 2);

      // Version/model tokens (alphanumeric with digits, e.g. s24, s25, 1000xm5, iphone16)
      // If the input has such a token that doesn't appear in the canonical title, it's a different model.
      const inputVersionWords = inputWords.filter(w => /\d/.test(w));
      const hasVersionMismatch = inputVersionWords.some(w => !pTitle.includes(w));
      if (hasVersionMismatch) continue;

      // Forward: fraction of input words found in canonical title
      const fwdMatches = inputWords.filter((w) => pTitle.includes(w)).length;
      const fwdRatio = inputWords.length > 0 ? fwdMatches / inputWords.length : 0;

      // Reverse: fraction of canonical words found in input title
      const revMatches = canonicalWords.filter((w) => titleLower.includes(w)).length;
      const revRatio = canonicalWords.length > 0 ? revMatches / canonicalWords.length : 0;

      // Take the best of both directions so long input titles still match
      // short canonical titles (and vice-versa).
      const score = Math.max(fwdRatio, revRatio);

      if (score > 0.5 && score > bestScore) {
        bestMatch = p;
        bestScore = score;
      }
    }
    return bestMatch;
  }

  getProductById(id: string): StoredProduct | null {
    return this.products.get(id) || null;
  }

  getAllProducts(category?: string, limit = 20): StoredProduct[] {
    let results = Array.from(this.products.values());
    if (category) {
      results = results.filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase(),
      );
    }
    return results.slice(0, limit);
  }

  searchProducts(query: string, category?: string): StoredProduct[] {
    const q = query.toLowerCase();
    let results = Array.from(this.products.values()).filter((p) => {
      const text =
        `${p.canonicalTitle} ${p.brand || ""} ${p.category || ""}`.toLowerCase();
      return text.includes(q);
    });
    if (category) {
      results = results.filter(
        (p) => p.category?.toLowerCase() === category.toLowerCase(),
      );
    }
    return results;
  }

  createProduct(data: {
    brand: string | null;
    model: string | null;
    gtin: string | null;
    canonicalTitle: string;
    category: string | null;
    image: string | null;
    subcategory?: string | null;
    specs?: Record<string, unknown> | null;
  }): StoredProduct {
    const id = uuid();
    const now = new Date().toISOString();
    const product: StoredProduct = {
      id,
      brand: data.brand,
      model: data.model,
      gtin: data.gtin,
      canonicalTitle: data.canonicalTitle,
      category: data.category,
      subcategory: data.subcategory || null,
      image: data.image,
      specs: data.specs || null,
      createdAt: now,
      updatedAt: now,
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
    originalPrice?: number | null;
    affiliateUrl?: string | null;
    affiliateNetwork?: string | null;
  }): StoredListing {
    const id = uuid();
    const now = new Date().toISOString();
    const listing: StoredListing = {
      id,
      productId: data.productId,
      platform: data.platform,
      externalId: data.externalId,
      url: data.url,
      title: data.title,
      sellerId: data.sellerId,
      lastPrice: data.lastPrice,
      originalPrice: data.originalPrice ?? null,
      currency: data.currency,
      condition: data.condition || "New",
      inStock: data.inStock ?? true,
      lastChecked: now,
      affiliateUrl: data.affiliateUrl ?? null,
      affiliateNetwork: data.affiliateNetwork ?? null,
      createdAt: now,
      updatedAt: now,
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
      listing.updatedAt = new Date().toISOString();
    }
  }

  // --- Price History ---

  addPriceHistory(
    listingId: string,
    price: number,
    currency: string,
    productId?: string,
  ): StoredPricePoint {
    const id = uuid();
    // Resolve productId from listing if not provided
    const resolvedProductId =
      productId || this.listings.get(listingId)?.productId || "";
    const point: StoredPricePoint = {
      id,
      listingId,
      productId: resolvedProductId,
      price,
      currency,
      recordedAt: new Date().toISOString(),
    };
    this.priceHistory.set(id, point);

    if (!this.historyByListing.has(listingId)) {
      this.historyByListing.set(listingId, []);
    }
    this.historyByListing.get(listingId)!.push(id);

    if (resolvedProductId) {
      if (!this.historyByProduct.has(resolvedProductId)) {
        this.historyByProduct.set(resolvedProductId, []);
      }
      this.historyByProduct.get(resolvedProductId)!.push(id);
    }

    return point;
  }

  getHistoryForListing(listingId: string): StoredPricePoint[] {
    const ids = this.historyByListing.get(listingId) || [];
    return ids
      .map((id) => this.priceHistory.get(id))
      .filter(Boolean) as StoredPricePoint[];
  }

  getHistoryForProduct(productId: string): StoredPricePoint[] {
    // First try the direct product index
    const directIds = this.historyByProduct.get(productId);
    if (directIds && directIds.length > 0) {
      return directIds
        .map((id) => this.priceHistory.get(id))
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(a!.recordedAt).getTime() -
            new Date(b!.recordedAt).getTime(),
        ) as StoredPricePoint[];
    }
    // Fallback: aggregate from listings
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
    const platLower = platform.toLowerCase();
    for (const s of this.sellers.values()) {
      if (s.platform.toLowerCase() === platLower) return s;
    }
    return null;
  }

  getSellerById(id: string): StoredSeller | null {
    return this.sellers.get(id) || null;
  }

  // --- Deals ---

  addDeal(data: Omit<StoredDeal, "id" | "createdAt">): StoredDeal {
    const id = uuid();
    const deal: StoredDeal = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.deals.set(id, deal);
    return deal;
  }

  getAllDeals(limit?: number): StoredDeal[] {
    const all = Array.from(this.deals.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return limit ? all.slice(0, limit) : all;
  }

  // --- Watchlist ---

  addWatchlistItem(
    data: Omit<StoredWatchlistItem, "id" | "createdAt" | "updatedAt">,
  ): StoredWatchlistItem {
    const id = uuid();
    const now = new Date().toISOString();
    const item: StoredWatchlistItem = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.watchlist.set(id, item);
    return item;
  }

  getWatchlistByUser(userId: string, limit?: number): StoredWatchlistItem[] {
    const items = Array.from(this.watchlist.values())
      .filter((w) => w.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    return limit ? items.slice(0, limit) : items;
  }

  removeWatchlistItem(id: string): boolean {
    return this.watchlist.delete(id);
  }

  // --- Notifications ---

  addNotification(
    data: Omit<StoredNotification, "id" | "createdAt">,
  ): StoredNotification {
    const id = uuid();
    const notification: StoredNotification = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  getNotificationsByUser(
    userId: string,
    limit = 20,
  ): StoredNotification[] {
    return Array.from(this.notifications.values())
      .filter((n) => n.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);
  }

  getTriggeredAlertCount(userId: string): number {
    return Array.from(this.notifications.values()).filter(
      (n) => n.userId === userId && !n.read && n.type === "price_alert",
    ).length;
  }

  markNotificationRead(id: string): boolean {
    const n = this.notifications.get(id);
    if (!n) return false;
    n.read = true;
    return true;
  }

  markAllNotificationsRead(ids: string[]): void {
    for (const id of ids) {
      this.markNotificationRead(id);
    }
  }

  // --- Affiliate Clicks ---

  addAffiliateClick(
    data: Omit<StoredAffiliateClick, "id" | "clickedAt">,
  ): StoredAffiliateClick {
    const id = uuid();
    const click: StoredAffiliateClick = {
      id,
      ...data,
      clickedAt: new Date().toISOString(),
    };
    this.affiliateClicks.set(id, click);
    return click;
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
    const listing = this.listings.get(listingId);
    const productId = listing?.productId || "";
    for (let d = days; d >= 0; d--) {
      const jitter = (Math.random() - 0.5) * basePrice * 0.08; // ±4%
      const price = Math.max(0, +(basePrice + jitter).toFixed(2));
      const point: StoredPricePoint = {
        id: uuid(),
        listingId,
        productId,
        price,
        currency,
        recordedAt: new Date(now - d * 86400000).toISOString(),
      };
      this.priceHistory.set(point.id, point);
      if (!this.historyByListing.has(listingId)) {
        this.historyByListing.set(listingId, []);
      }
      this.historyByListing.get(listingId)!.push(point.id);

      if (productId) {
        if (!this.historyByProduct.has(productId)) {
          this.historyByProduct.set(productId, []);
        }
        this.historyByProduct.get(productId)!.push(point.id);
      }
    }
  }
}
