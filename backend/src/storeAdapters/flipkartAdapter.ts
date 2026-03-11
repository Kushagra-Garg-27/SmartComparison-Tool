/**
 * Flipkart Store Adapter — Searches and parses Flipkart product listings.
 */

import * as cheerio from "cheerio";
import { BaseStoreAdapter, type StoreListing, type AdapterSearchOptions } from "./baseAdapter.js";

export class FlipkartAdapter extends BaseStoreAdapter {
  readonly storeId = "flipkart";
  readonly storeName = "Flipkart";
  readonly baseUrl = "https://www.flipkart.com";
  readonly currency = "INR";
  readonly trustScore = 92;
  readonly defaultDeliveryInfo = "Free delivery on orders over ₹500";
  readonly defaultReturnPolicy = "7-day replacement";

  buildSearchUrl(query: string): string {
    return `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
  }

  async searchProducts(query: string, options?: AdapterSearchOptions): Promise<StoreListing[]> {
    const limit = options?.limit ?? 3;
    const listings: StoreListing[] = [];

    try {
      const html = await this.fetchHtml(this.buildSearchUrl(query));
      const $ = cheerio.load(html);

      // Flipkart uses multiple layout variations
      const selectors = [
        "div._1AtVbE div._13oc-S", // Grid layout
        "div[data-id]",             // Card layout
        "div._1xHGtK._373qXS",     // List layout
        "a._1fQZEK",               // Product cards
        "div._2kHMtA",             // Newer layout
      ];

      for (const selector of selectors) {
        if (listings.length >= limit) break;
        $(selector).each((_i, el) => {
          if (listings.length >= limit) return false;

          const title = $(el).find("div._4rR01T, a.s1Q9rs, a.IRpwTa, div.KzDlHZ").first().text().trim() ||
                        $(el).find("a[title]").first().attr("title") || "";
          const priceText = $(el).find("div._30jeq3, div._25b18c div._30jeq3").first().text().trim();
          const originalPriceText = $(el).find("div._3I9_wc, div._25b18c div._3I9_wc").first().text().trim();
          const image = $(el).find("img._396cs4, img._2r_T1I").first().attr("src") || null;
          let link = $(el).find("a._1fQZEK, a.s1Q9rs, a.IRpwTa, a.CGtC98").first().attr("href") ||
                     $(el).attr("href") || "";

          const price = this.parsePrice(priceText);
          if (!title || !price) return;

          const url = link.startsWith("http") ? link : `${this.baseUrl}${link}`;
          const listing = this.createBaseListing(title, price, url);
          listing.image = image;
          listing.originalPrice = this.parsePrice(originalPriceText);

          const ratingText = $(el).find("div._3LWZlK, span._1lRcqv div._3LWZlK").first().text().trim();
          listing.rating = ratingText ? parseFloat(ratingText) || null : null;

          const reviewText = $(el).find("span._2_R_DZ").first().text();
          const reviewMatch = reviewText.match(/([\d,]+)\s*(?:Ratings|Reviews)/i);
          listing.reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, ""), 10) : null;

          listings.push(listing);
        });
      }
    } catch (err) {
      if (listings.length === 0) throw err;
    }

    return listings;
  }
}
