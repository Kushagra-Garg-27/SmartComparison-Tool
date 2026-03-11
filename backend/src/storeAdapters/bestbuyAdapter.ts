/**
 * Best Buy Store Adapter — Searches and parses BestBuy product listings.
 */

import * as cheerio from "cheerio";
import { BaseStoreAdapter, type StoreListing, type AdapterSearchOptions } from "./baseAdapter.js";

export class BestBuyAdapter extends BaseStoreAdapter {
  readonly storeId = "bestbuy";
  readonly storeName = "Best Buy";
  readonly baseUrl = "https://www.bestbuy.com";
  readonly currency = "USD";
  readonly trustScore = 94;
  readonly defaultDeliveryInfo = "Free shipping on orders over $35";
  readonly defaultReturnPolicy = "15-day return policy";

  buildSearchUrl(query: string): string {
    return `${this.baseUrl}/site/searchpage.jsp?st=${encodeURIComponent(query)}`;
  }

  async searchProducts(query: string, options?: AdapterSearchOptions): Promise<StoreListing[]> {
    const limit = options?.limit ?? 3;
    const listings: StoreListing[] = [];

    try {
      const html = await this.fetchHtml(this.buildSearchUrl(query));
      const $ = cheerio.load(html);

      $(".sku-item, .list-item").each((_i, el) => {
        if (listings.length >= limit) return false;

        const title = $(el).find(".sku-title a, .sku-header a, h4.sku-title a").first().text().trim();
        const priceText = $(el).find('.priceView-customer-price span[aria-hidden="true"], .priceView-hero-price span').first().text().trim();
        const link = $(el).find(".sku-title a, .sku-header a, h4.sku-title a").first().attr("href") || "";
        const image = $(el).find("img.product-image").attr("src") || null;
        const skuMatch = link.match(/\/(\d{7})\.p/);

        const price = this.parsePrice(priceText);
        if (!title || !price) return;

        const url = link.startsWith("http") ? link : `${this.baseUrl}${link}`;
        const listing = this.createBaseListing(title, price, url);
        listing.image = image;
        listing.externalId = skuMatch?.[1] || null;

        const ratingText = $(el).find(".c-ratings-reviews-v4 .c-reviews").text().trim();
        const ratingMatch = ratingText.match(/([\d.]+)/);
        listing.rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

        const reviewText = $(el).find(".c-ratings-reviews-v4 .c-total-reviews").text().trim();
        const reviewMatch = reviewText.match(/\(([\d,]+)\)/);
        listing.reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, ""), 10) : null;

        listings.push(listing);
      });
    } catch (err) {
      if (listings.length === 0) throw err;
    }

    return listings;
  }
}
