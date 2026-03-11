/**
 * Walmart Store Adapter — Searches and parses Walmart product listings.
 */

import * as cheerio from "cheerio";
import { BaseStoreAdapter, type StoreListing, type AdapterSearchOptions } from "./baseAdapter.js";

export class WalmartAdapter extends BaseStoreAdapter {
  readonly storeId = "walmart";
  readonly storeName = "Walmart";
  readonly baseUrl = "https://www.walmart.com";
  readonly currency = "USD";
  readonly trustScore = 92;
  readonly defaultDeliveryInfo = "Free shipping on orders over $35";
  readonly defaultReturnPolicy = "90-day return policy";

  buildSearchUrl(query: string): string {
    return `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
  }

  async searchProducts(query: string, options?: AdapterSearchOptions): Promise<StoreListing[]> {
    const limit = options?.limit ?? 3;
    const listings: StoreListing[] = [];

    try {
      const html = await this.fetchHtml(this.buildSearchUrl(query));
      const $ = cheerio.load(html);

      // Try to extract from JSON data embedded in page
      const scriptTags = $('script[type="application/json"]');
      scriptTags.each((_i, el) => {
        try {
          const text = $(el).text();
          if (!text.includes("searchResult") && !text.includes("itemStacks")) return;
          const data = JSON.parse(text);
          const items = this.extractWalmartItems(data);
          for (const item of items) {
            if (listings.length >= limit) break;
            listings.push(item);
          }
        } catch {
          // continue
        }
      });

      // Fallback: DOM parsing
      if (listings.length === 0) {
        $('[data-item-id], div[data-testid="list-view"]').each((_i, el) => {
          if (listings.length >= limit) return false;

          const title = $(el).find('[data-automation-id="product-title"], span.lh-title').first().text().trim();
          const priceText = $(el).find('[data-automation-id="product-price"] span, .f2').first().text().trim();
          const link = $(el).find("a").first().attr("href") || "";
          const image = $(el).find("img").first().attr("src") || null;

          const price = this.parsePrice(priceText);
          if (!title || !price) return;

          const url = link.startsWith("http") ? link : `${this.baseUrl}${link}`;
          const listing = this.createBaseListing(title, price, url);
          listing.image = image;

          listings.push(listing);
        });
      }
    } catch (err) {
      if (listings.length === 0) throw err;
    }

    return listings;
  }

  private extractWalmartItems(data: unknown): StoreListing[] {
    const results: StoreListing[] = [];
    try {
      const items = this.findNestedItems(data);
      for (const item of items) {
        if (!item.name || !item.price) continue;
        const listing = this.createBaseListing(
          item.name,
          item.price,
          item.url ? (item.url.startsWith("http") ? item.url : `${this.baseUrl}${item.url}`) : this.baseUrl,
        );
        listing.image = item.image || null;
        listing.rating = item.rating || null;
        listing.reviewCount = item.reviewCount || null;
        listing.externalId = item.id || null;
        results.push(listing);
      }
    } catch {
      // ignore
    }
    return results;
  }

  private findNestedItems(obj: unknown): Array<{name: string; price: number; url?: string; image?: string; rating?: number; reviewCount?: number; id?: string}> {
    const items: Array<{name: string; price: number; url?: string; image?: string; rating?: number; reviewCount?: number; id?: string}> = [];
    if (!obj || typeof obj !== "object") return items;

    if (Array.isArray(obj)) {
      for (const el of obj) {
        items.push(...this.findNestedItems(el));
      }
      return items;
    }

    const record = obj as Record<string, unknown>;
    // Check if this looks like a product item
    if (record.name && typeof record.name === "string" && (record.priceInfo || record.price)) {
      const priceInfo = record.priceInfo as Record<string, unknown> | undefined;
      const price = priceInfo?.currentPrice as Record<string, unknown> | undefined;
      const priceVal = (price?.price as number) ?? (record.price as number);
      if (priceVal && priceVal > 0) {
        items.push({
          name: record.name as string,
          price: priceVal,
          url: (record.canonicalUrl || record.url) as string | undefined,
          image: (record.imageUrl || record.image) as string | undefined,
          rating: (record.averageRating || record.rating) as number | undefined,
          reviewCount: (record.numberOfReviews || record.reviewCount) as number | undefined,
          id: (record.usItemId || record.id) as string | undefined,
        });
        return items;
      }
    }

    // Recurse into values
    for (const val of Object.values(record)) {
      if (val && typeof val === "object") {
        items.push(...this.findNestedItems(val));
      }
    }
    return items;
  }
}
