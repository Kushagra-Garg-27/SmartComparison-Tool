/**
 * eBay Store Adapter — Searches and parses eBay product listings.
 */

import * as cheerio from "cheerio";
import { BaseStoreAdapter, type StoreListing, type AdapterSearchOptions } from "./baseAdapter.js";

export class EbayAdapter extends BaseStoreAdapter {
  readonly storeId = "ebay";
  readonly storeName = "eBay";
  readonly baseUrl = "https://www.ebay.com";
  readonly currency = "USD";
  readonly trustScore = 85;
  readonly defaultDeliveryInfo = "Shipping varies by seller";
  readonly defaultReturnPolicy = "30-day return (varies by seller)";

  buildSearchUrl(query: string): string {
    return `${this.baseUrl}/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=0&LH_BIN=1`;
  }

  async searchProducts(query: string, options?: AdapterSearchOptions): Promise<StoreListing[]> {
    const limit = options?.limit ?? 3;
    const listings: StoreListing[] = [];

    try {
      const html = await this.fetchHtml(this.buildSearchUrl(query));
      const $ = cheerio.load(html);

      $(".s-item").each((_i, el) => {
        if (listings.length >= limit) return false;

        const title = $(el).find(".s-item__title span, .s-item__title").first().text().trim();
        if (!title || title === "Shop on eBay") return;

        const priceText = $(el).find(".s-item__price").first().text().trim();
        const link = $(el).find(".s-item__link").attr("href") || "";
        const image = $(el).find(".s-item__image-img").attr("src") || null;

        const price = this.parsePrice(priceText);
        if (!price || !link) return;

        // Extract item ID from URL
        const itemMatch = link.match(/\/itm\/.*?\/(\d+)/);
        const externalId = itemMatch?.[1] || null;

        const listing = this.createBaseListing(title, price, link);
        listing.externalId = externalId;
        listing.image = image;

        // eBay seller info
        const sellerInfo = $(el).find(".s-item__seller-info-text").text().trim();
        if (sellerInfo) listing.seller = sellerInfo;

        const shippingText = $(el).find(".s-item__shipping, .s-item__freeXDays").text().trim();
        if (shippingText) listing.deliveryInfo = shippingText;

        listings.push(listing);
      });
    } catch (err) {
      if (listings.length === 0) throw err;
    }

    return listings;
  }
}
