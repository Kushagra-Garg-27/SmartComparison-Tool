/**
 * DatabaseStore — PostgreSQL-backed data store using Drizzle ORM.
 *
 * Drop-in async replacement for MemoryStore.
 * All public methods mirror MemoryStore's API but return Promises.
 */

import crypto from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { eq, and, desc, ilike, sql, asc, inArray } from "drizzle-orm";
import * as schema from "../db/schema.js";
import { config } from "../config.js";

function uuid(): string {
  return crypto.randomUUID();
}

// Drizzle DB singleton
let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    const client = neon(config.databaseUrl);
    _db = drizzle(client, { schema });
  }
  return _db;
}

export class DatabaseStore {
  private db: NeonHttpDatabase<typeof schema>;

  constructor(db?: NeonHttpDatabase<typeof schema>) {
    this.db = db ?? getDb();
  }

  // --- Products ---

  async findProductByGtin(gtin: string) {
    const rows = await this.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.gtin, gtin))
      .limit(1);
    return rows[0] ? this.mapProduct(rows[0]) : null;
  }

  async findProductByTitleBrand(title: string, brand: string | null) {
    // Use ILIKE for fuzzy matching; the in-memory version used word overlap
    // For production we do a simplified approach: search by brand + title keywords
    const titleWords = title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5);

    let query = this.db.select().from(schema.products);

    if (brand) {
      query = query.where(ilike(schema.products.brand, brand)) as typeof query;
    }

    const candidates = await query.limit(50);

    // Score candidates with word overlap (same logic as MemoryStore)
    const titleLower = title.toLowerCase();
    let bestMatch: (typeof candidates)[0] | null = null;
    let bestScore = 0;

    for (const p of candidates) {
      const pTitle = (p.canonicalTitle || "").toLowerCase();
      const inputWords = titleLower.split(/\s+/).filter((w) => w.length > 2);
      const canonicalWords = pTitle.split(/\s+/).filter((w) => w.length > 2);

      // Version mismatch check
      const inputVersionWords = inputWords.filter((w) => /\d/.test(w));
      const hasVersionMismatch = inputVersionWords.some((w) => !pTitle.includes(w));
      if (hasVersionMismatch) continue;

      const fwdMatches = inputWords.filter((w) => pTitle.includes(w)).length;
      const fwdRatio = inputWords.length > 0 ? fwdMatches / inputWords.length : 0;
      const revMatches = canonicalWords.filter((w) => titleLower.includes(w)).length;
      const revRatio = canonicalWords.length > 0 ? revMatches / canonicalWords.length : 0;
      const score = Math.max(fwdRatio, revRatio);

      if (score > 0.5 && score > bestScore) {
        bestMatch = p;
        bestScore = score;
      }
    }

    return bestMatch ? this.mapProduct(bestMatch) : null;
  }

  async getProductById(id: string) {
    const rows = await this.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);
    return rows[0] ? this.mapProduct(rows[0]) : null;
  }

  async getAllProducts(category?: string, limit = 20) {
    const conditions = category ? ilike(schema.products.category, category) : undefined;
    const rows = conditions
      ? await this.db.select().from(schema.products).where(conditions).limit(limit)
      : await this.db.select().from(schema.products).limit(limit);
    return rows.map((r) => this.mapProduct(r));
  }

  async searchProducts(queryStr: string, category?: string) {
    const pattern = `%${queryStr}%`;
    const conditions = category
      ? and(ilike(schema.products.canonicalTitle, pattern), ilike(schema.products.category, category))
      : ilike(schema.products.canonicalTitle, pattern);

    const rows = await this.db
      .select()
      .from(schema.products)
      .where(conditions)
      .limit(50);
    return rows.map((r) => this.mapProduct(r));
  }

  async createProduct(data: {
    brand: string | null;
    model: string | null;
    gtin: string | null;
    canonicalTitle: string;
    category: string | null;
    image: string | null;
    subcategory?: string | null;
    specs?: Record<string, unknown> | null;
  }) {
    const id = uuid();
    const now = new Date();
    await this.db.insert(schema.products).values({
      id,
      brand: data.brand,
      model: data.model,
      gtin: data.gtin,
      canonicalTitle: data.canonicalTitle,
      category: data.category,
      subcategory: data.subcategory || null,
      image: data.image,
      specs: data.specs || {},
      createdAt: now,
      updatedAt: now,
    });
    return {
      id,
      brand: data.brand,
      model: data.model,
      gtin: data.gtin,
      canonicalTitle: data.canonicalTitle,
      category: data.category,
      subcategory: data.subcategory || null,
      image: data.image,
      specs: data.specs || {},
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  // --- Listings ---

  async getListingsForProduct(productId: string) {
    const rows = await this.db
      .select()
      .from(schema.productListings)
      .where(eq(schema.productListings.productId, productId));
    return rows.map((r) => this.mapListing(r));
  }

  async findListingByPlatformExternalId(platform: string, externalId: string) {
    const rows = await this.db
      .select()
      .from(schema.productListings)
      .where(
        and(
          eq(schema.productListings.store, platform),
          eq(schema.productListings.externalId, externalId),
        ),
      )
      .limit(1);
    return rows[0] ? this.mapListing(rows[0]) : null;
  }

  async createListing(data: {
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
  }) {
    const id = uuid();
    const now = new Date();
    await this.db.insert(schema.productListings).values({
      id,
      productId: data.productId,
      store: data.platform,
      externalId: data.externalId,
      url: data.url,
      title: data.title,
      sellerId: data.sellerId,
      lastPrice: data.lastPrice?.toString() ?? null,
      originalPrice: (data.originalPrice ?? null)?.toString() ?? null,
      currency: data.currency,
      condition: data.condition || "New",
      inStock: data.inStock ?? true,
      affiliateUrl: data.affiliateUrl ?? null,
      affiliateNetwork: data.affiliateNetwork ?? null,
      lastChecked: now,
      createdAt: now,
    });
    return {
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
      lastChecked: now.toISOString(),
      affiliateUrl: data.affiliateUrl ?? null,
      affiliateNetwork: data.affiliateNetwork ?? null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  async updateListingPrice(listingId: string, price: number): Promise<void> {
    const now = new Date();
    await this.db
      .update(schema.productListings)
      .set({
        lastPrice: price.toString(),
        lastChecked: now,
      })
      .where(eq(schema.productListings.id, listingId));
  }

  // --- Price History ---

  async addPriceHistory(
    listingId: string,
    price: number,
    currency: string,
    productId?: string,
  ) {
    // Resolve productId from listing if not provided
    let resolvedProductId = productId || "";
    if (!resolvedProductId) {
      const listing = await this.db
        .select({ productId: schema.productListings.productId })
        .from(schema.productListings)
        .where(eq(schema.productListings.id, listingId))
        .limit(1);
      resolvedProductId = listing[0]?.productId || "";
    }

    const id = uuid();
    const now = new Date();

    // Get store from listing
    const listingRow = await this.db
      .select({ store: schema.productListings.store })
      .from(schema.productListings)
      .where(eq(schema.productListings.id, listingId))
      .limit(1);
    const store = listingRow[0]?.store || "unknown";

    await this.db.insert(schema.priceHistory).values({
      id,
      listingId,
      productId: resolvedProductId,
      store,
      price: price.toString(),
      currency,
      recordedAt: now,
    });

    return {
      id,
      listingId,
      productId: resolvedProductId,
      price,
      currency,
      recordedAt: now.toISOString(),
    };
  }

  async getHistoryForListing(listingId: string) {
    const rows = await this.db
      .select()
      .from(schema.priceHistory)
      .where(eq(schema.priceHistory.listingId, listingId))
      .orderBy(asc(schema.priceHistory.recordedAt));
    return rows.map((r) => this.mapPricePoint(r));
  }

  async getHistoryForProduct(productId: string) {
    const rows = await this.db
      .select()
      .from(schema.priceHistory)
      .where(eq(schema.priceHistory.productId, productId))
      .orderBy(asc(schema.priceHistory.recordedAt));
    return rows.map((r) => this.mapPricePoint(r));
  }

  // --- Sellers ---

  async addSeller(data: {
    id?: string;
    name: string;
    platform: string;
    trustScore: number;
  }) {
    const id = data.id || uuid();
    await this.db
      .insert(schema.sellers)
      .values({
        id,
        name: data.name,
        platform: data.platform,
        trustScore: data.trustScore,
      })
      .onConflictDoNothing();
    return {
      id,
      name: data.name,
      platform: data.platform,
      trustScore: data.trustScore,
    };
  }

  async findSellerByPlatform(platform: string) {
    const platLower = platform.toLowerCase();
    const rows = await this.db
      .select()
      .from(schema.sellers)
      .where(ilike(schema.sellers.platform, platLower))
      .limit(1);
    return rows[0]
      ? {
          id: rows[0].id,
          name: rows[0].name,
          platform: rows[0].platform,
          trustScore: rows[0].trustScore,
        }
      : null;
  }

  async getSellerById(id: string) {
    const rows = await this.db
      .select()
      .from(schema.sellers)
      .where(eq(schema.sellers.id, id))
      .limit(1);
    return rows[0]
      ? {
          id: rows[0].id,
          name: rows[0].name,
          platform: rows[0].platform,
          trustScore: rows[0].trustScore,
        }
      : null;
  }

  // --- Deals ---

  async addDeal(data: {
    productId?: string;
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
  }) {
    const id = uuid();
    const now = new Date();
    await this.db.insert(schema.deals).values({
      id,
      productId: data.productId || null,
      productName: data.productName,
      productImage: data.productImage,
      originalPrice: data.originalPrice.toString(),
      dealPrice: data.dealPrice.toString(),
      discountPercent: data.discountPercent?.toString() ?? null,
      dealScore: data.dealScore,
      store: data.store,
      category: data.category,
      isLimitedTime: data.isLimitedTime,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      createdAt: now,
    });
    return {
      id,
      productId: data.productId,
      productName: data.productName,
      productImage: data.productImage,
      originalPrice: data.originalPrice,
      dealPrice: data.dealPrice,
      discountPercent: data.discountPercent,
      dealScore: data.dealScore,
      store: data.store,
      category: data.category,
      isLimitedTime: data.isLimitedTime,
      expiresAt: data.expiresAt,
      createdAt: now.toISOString(),
    };
  }

  async getAllDeals(limit?: number) {
    let query = this.db
      .select()
      .from(schema.deals)
      .orderBy(desc(schema.deals.createdAt));
    if (limit) {
      query = query.limit(limit) as typeof query;
    }
    const rows = await query;
    return rows.map((r) => ({
      id: r.id,
      productId: r.productId ?? undefined,
      productName: r.productName,
      productImage: r.productImage,
      originalPrice: parseFloat(r.originalPrice),
      dealPrice: parseFloat(r.dealPrice),
      discountPercent: r.discountPercent ? parseFloat(r.discountPercent) : null,
      dealScore: r.dealScore,
      store: r.store,
      category: r.category,
      isLimitedTime: r.isLimitedTime,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  // --- Watchlist ---

  async addWatchlistItem(data: {
    userId: string;
    productName: string;
    productImage: string | null;
    productUrl: string | null;
    store: string;
    currentPrice: number;
    alertPrice: number | null;
    trend: string | null;
  }) {
    const id = uuid();
    const now = new Date();
    await this.db.insert(schema.watchlist).values({
      id,
      userId: data.userId,
      productName: data.productName,
      productImage: data.productImage,
      productUrl: data.productUrl,
      store: data.store,
      currentPrice: data.currentPrice.toString(),
      alertPrice: data.alertPrice?.toString() ?? null,
      trend: data.trend,
      createdAt: now,
      updatedAt: now,
    });
    return {
      id,
      userId: data.userId,
      productName: data.productName,
      productImage: data.productImage,
      productUrl: data.productUrl,
      store: data.store,
      currentPrice: data.currentPrice,
      alertPrice: data.alertPrice,
      trend: data.trend,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  async getWatchlistByUser(userId: string, limit?: number) {
    let query = this.db
      .select()
      .from(schema.watchlist)
      .where(eq(schema.watchlist.userId, userId))
      .orderBy(desc(schema.watchlist.createdAt));
    if (limit) {
      query = query.limit(limit) as typeof query;
    }
    const rows = await query;
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      productName: r.productName,
      productImage: r.productImage,
      productUrl: r.productUrl,
      store: r.store || "",
      currentPrice: r.currentPrice ? parseFloat(r.currentPrice) : 0,
      alertPrice: r.alertPrice ? parseFloat(r.alertPrice) : null,
      trend: r.trend,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async removeWatchlistItem(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.watchlist)
      .where(eq(schema.watchlist.id, id));
    return true; // Drizzle doesn't return count easily via neon-http; treat as success
  }

  // --- Notifications ---

  async addNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    link: string | null;
  }) {
    const id = uuid();
    const now = new Date();
    await this.db.insert(schema.notifications).values({
      id,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      read: data.read,
      link: data.link,
      createdAt: now,
    });
    return {
      id,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      read: data.read,
      link: data.link,
      createdAt: now.toISOString(),
    };
  }

  async getNotificationsByUser(userId: string, limit = 20) {
    const rows = await this.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      title: r.title,
      message: r.message,
      type: r.type,
      read: r.read,
      link: r.link,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getTriggeredAlertCount(userId: string): Promise<number> {
    const rows = await this.db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.read, false),
          eq(schema.notifications.type, "price_alert"),
        ),
      );
    return rows.length;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    await this.db
      .update(schema.notifications)
      .set({ read: true })
      .where(eq(schema.notifications.id, id));
    return true;
  }

  async markAllNotificationsRead(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db
      .update(schema.notifications)
      .set({ read: true })
      .where(inArray(schema.notifications.id, ids));
  }

  // --- Affiliate Clicks ---

  async addAffiliateClick(data: {
    userId: string | null;
    listingId: string;
    productId: string;
    store: string;
    affiliateNetwork: string | null;
  }) {
    const id = uuid();
    const now = new Date();
    await this.db.insert(schema.affiliateClicks).values({
      id,
      userId: data.userId,
      listingId: data.listingId,
      productId: data.productId,
      store: data.store,
      affiliateNetwork: data.affiliateNetwork,
      clickedAt: now,
    });
    return {
      id,
      ...data,
      clickedAt: now.toISOString(),
    };
  }

  // --- Bulk seed helper ---

  async generateSyntheticHistory(
    listingId: string,
    basePrice: number,
    currency: string,
    days: number = 30,
  ): Promise<void> {
    const now = Date.now();
    // Get listing's productId and store
    const listing = await this.db
      .select({
        productId: schema.productListings.productId,
        store: schema.productListings.store,
      })
      .from(schema.productListings)
      .where(eq(schema.productListings.id, listingId))
      .limit(1);
    const productId = listing[0]?.productId || "";
    const store = listing[0]?.store || "unknown";

    const values: Array<{
      id: string;
      listingId: string;
      productId: string;
      store: string;
      price: string;
      currency: string;
      recordedAt: Date;
    }> = [];

    for (let d = days; d >= 0; d--) {
      const jitter = (Math.random() - 0.5) * basePrice * 0.08;
      const price = Math.max(0, +(basePrice + jitter).toFixed(2));
      values.push({
        id: uuid(),
        listingId,
        productId,
        store,
        price: price.toString(),
        currency,
        recordedAt: new Date(now - d * 86400000),
      });
    }

    // Batch insert
    if (values.length > 0) {
      await this.db.insert(schema.priceHistory).values(values);
    }
  }

  // --- Private mappers ---

  private mapProduct(row: typeof schema.products.$inferSelect) {
    return {
      id: row.id,
      brand: row.brand,
      model: row.model,
      gtin: row.gtin,
      canonicalTitle: row.canonicalTitle,
      category: row.category,
      subcategory: row.subcategory,
      image: row.image,
      specs: (row.specs as Record<string, unknown>) || {},
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapListing(row: typeof schema.productListings.$inferSelect) {
    return {
      id: row.id,
      productId: row.productId,
      platform: row.store,
      externalId: row.externalId,
      url: row.url,
      title: row.title,
      sellerId: row.sellerId,
      lastPrice: row.lastPrice ? parseFloat(row.lastPrice) : null,
      originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : null,
      currency: row.currency,
      condition: row.condition,
      inStock: row.inStock,
      lastChecked: row.lastChecked.toISOString(),
      affiliateUrl: row.affiliateUrl,
      affiliateNetwork: row.affiliateNetwork,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.createdAt.toISOString(), // listings don't have separate updatedAt column
    };
  }

  private mapPricePoint(row: typeof schema.priceHistory.$inferSelect) {
    return {
      id: row.id,
      listingId: row.listingId,
      productId: row.productId,
      price: parseFloat(row.price),
      currency: row.currency,
      recordedAt: row.recordedAt.toISOString(),
    };
  }
}
