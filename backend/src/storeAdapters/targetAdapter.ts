/**
 * Target Store Adapter — Searches and parses Target product listings.
 */

import * as cheerio from "cheerio";
import { BaseStoreAdapter, type StoreListing, type AdapterSearchOptions } from "./baseAdapter.js";

export class TargetAdapter extends BaseStoreAdapter {
  readonly storeId = "target";
  readonly storeName = "Target";
  readonly baseUrl = "https://www.target.com";
  readonly currency = "USD";
  readonly trustScore = 91;
  readonly defaultDeliveryInfo = "Free shipping on orders over $35";
  readonly defaultReturnPolicy = "90-day return policy";

  buildSearchUrl(query: string): string {
    return `${this.baseUrl}/s?searchTerm=${encodeURIComponent(query)}`;
  }

  async searchProducts(query: string, options?: AdapterSearchOptions): Promise<StoreListing[]> {
    const limit = options?.limit ?? 3;
    const listings: StoreListing[] = [];

    try {
      const html = await this.fetchHtml(this.buildSearchUrl(query));
      const $ = cheerio.load(html);

      $('[data-test="product-grid"] [data-test="@web/site-top-of-funnel/ProductCardWrapper"]').each((_i, el) => {
        if (listings.length >= limit) return false;

        const title = $(el).find('[data-test="product-title"] a').text().trim();
        const priceText = $(el).find('[data-test="current-price"] span').first().text().trim();
        const link = $(el).find('[data-test="product-title"] a').attr("href") || "";
        const image = $(el).find("picture img").first().attr("src") || null;

        const price = this.parsePrice(priceText);
        if (!title || !price) return;

        const url = link.startsWith("http") ? link : `${this.baseUrl}${link}`;
        const listing = this.createBaseListing(title, price, url);
        listing.image = image;

        listings.push(listing);
      });
    } catch (err) {
      if (listings.length === 0) throw err;
    }

    return listings;
  }
}
