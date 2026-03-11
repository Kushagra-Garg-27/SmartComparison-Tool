/**
 * Newegg Store Adapter — Searches and parses Newegg product listings.
 */

import * as cheerio from "cheerio";
import { BaseStoreAdapter, type StoreListing, type AdapterSearchOptions } from "./baseAdapter.js";

export class NeweggAdapter extends BaseStoreAdapter {
  readonly storeId = "newegg";
  readonly storeName = "Newegg";
  readonly baseUrl = "https://www.newegg.com";
  readonly currency = "USD";
  readonly trustScore = 88;
  readonly defaultDeliveryInfo = "Free shipping on eligible items";
  readonly defaultReturnPolicy = "30-day return policy";

  buildSearchUrl(query: string): string {
    return `${this.baseUrl}/p/pl?d=${encodeURIComponent(query)}`;
  }

  async searchProducts(query: string, options?: AdapterSearchOptions): Promise<StoreListing[]> {
    const limit = options?.limit ?? 3;
    const listings: StoreListing[] = [];

    try {
      const html = await this.fetchHtml(this.buildSearchUrl(query));
      const $ = cheerio.load(html);

      $(".item-cell, .item-container").each((_i, el) => {
        if (listings.length >= limit) return false;

        const title = $(el).find(".item-title, a.item-title").first().text().trim();
        const priceText = $(el).find("li.price-current strong, .price-current").first().text().trim();
        const link = $(el).find(".item-title, a.item-title").first().attr("href") || "";
        const image = $(el).find(".item-img img, img.lazy-img").first().attr("src") || null;

        const price = this.parsePrice(priceText);
        if (!title || !price) return;

        const url = link.startsWith("http") ? link : `${this.baseUrl}${link}`;
        const listing = this.createBaseListing(title, price, url);
        listing.image = image;

        // Extract Newegg item number
        const itemMatch = url.match(/\/p\/([A-Z0-9-]+)/i);
        listing.externalId = itemMatch?.[1] || null;

        const ratingEl = $(el).find(".item-rating");
        if (ratingEl.length) {
          const ratingClass = ratingEl.attr("class") || "";
          const ratingMatch = ratingClass.match(/rating-(\d)/);
          listing.rating = ratingMatch ? parseInt(ratingMatch[1]) : null;
        }

        const reviewText = $(el).find(".item-rating-num").text().trim();
        const reviewMatch = reviewText.match(/\((\d+)\)/);
        listing.reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : null;

        const shippingText = $(el).find(".price-ship").text().trim();
        if (shippingText) listing.deliveryInfo = shippingText;

        listings.push(listing);
      });
    } catch (err) {
      if (listings.length === 0) throw err;
    }

    return listings;
  }
}
