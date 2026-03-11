/**
 * Reliance Digital Scraper — Extracts product data from reliancedigital.in
 */

import * as cheerio from "cheerio";
import type { StoreScraper, ScraperResult, ScraperSearchResult } from "./base.js";
import {
  parsePrice,
  extractJsonLd,
  extractPriceFromJsonLd,
  safeFetch,
  createBaseResult,
} from "./base.js";

export class RelianceDigitalScraper implements StoreScraper {
  readonly storeId = "reliance-digital";

  async scrapeProduct(url: string): Promise<ScraperResult> {
    const result = createBaseResult(this.storeId, url);

    try {
      const html = await safeFetch(url);
      const $ = cheerio.load(html);

      // Extract product ID from URL
      const pidMatch = url.match(/\/p\/(\d+)/);
      result.externalId = pidMatch?.[1] ?? null;

      // Title
      result.title =
        $("h1.pdp__title").text().trim() ||
        $("h1[class*='product-title']").text().trim() ||
        $("h1").first().text().trim();

      // Try JSON-LD first
      const jsonLd = extractJsonLd(html);
      if (jsonLd) {
        const { price, originalPrice, currency } = extractPriceFromJsonLd(jsonLd);
        if (price) {
          result.price = price;
          result.originalPrice = originalPrice;
          result.currency = currency || "INR";
          result.extractedVia = "json-ld";
        }
      }

      // Fallback: CSS selectors
      if (!result.price) {
        const priceSelectors = [
          "span.pdp__offerPrice",
          "span.pdp__priceSection__priceListText",
          "li.pdp__priceSection__price",
          "span[class*='offer-price']",
          "span.price",
          "div.pdp__priceSection span",
        ];

        for (const sel of priceSelectors) {
          const text = $(sel).first().text().trim();
          const price = parsePrice(text);
          if (price && price > 100) {
            result.price = price;
            result.currency = "INR";
            result.extractedVia = "selector";
            break;
          }
        }
      }

      // Original / MRP price
      if (!result.originalPrice) {
        const mrpText =
          $("span.pdp__mrpPrice, span[class*='mrp']").first().text().trim() ||
          $("span.old-price").first().text().trim();
        result.originalPrice = parsePrice(mrpText);
      }

      // Meta tag fallback
      if (!result.price) {
        const metaPrice =
          $('meta[property="product:price:amount"]').attr("content") ||
          $('meta[property="og:price:amount"]').attr("content");
        if (metaPrice) {
          result.price = parseFloat(metaPrice) || null;
          result.currency = "INR";
          result.extractedVia = "meta";
        }
      }

      // Availability
      const stockEl = $("div.pdp__product-stock, span[class*='stock']");
      const stockText = stockEl.text().toLowerCase();
      result.availability =
        !stockText.includes("out of stock") && result.price !== null;

      // Image
      result.image =
        $("img.pdp__image").attr("src") ||
        $("img[class*='product-image']").attr("src") ||
        $('meta[property="og:image"]').attr("content") ||
        null;

      // Seller — Reliance is typically the seller
      result.seller = "Reliance Digital";

      // Rating
      const ratingText = $("span.pdp__rating, div[class*='rating'] span")
        .first()
        .text()
        .trim();
      const ratingVal = parseFloat(ratingText);
      result.rating = isNaN(ratingVal) ? null : ratingVal;

      result.deliveryInfo = "Free shipping above ₹500";
      result.returnPolicy = "10-day return policy";

    } catch (err) {
      result.error = err instanceof Error ? err.message : String(err);
    }

    return result;
  }

  async searchProducts(query: string, limit = 5): Promise<ScraperSearchResult[]> {
    const results: ScraperSearchResult[] = [];
    try {
      const searchUrl = `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}`;
      const html = await safeFetch(searchUrl);
      const $ = cheerio.load(html);

      $("div.sp__product, div[class*='product-card'], li.product").each(
        (_i, el) => {
          if (results.length >= limit) return false;

          const title =
            $(el).find("p.sp__name, a[class*='product-title']").text().trim() ||
            $(el).find("a").first().text().trim();
          const link =
            $(el).find("a[class*='product']").attr("href") ||
            $(el).find("a").first().attr("href");
          const priceText = $(el)
            .find("span[class*='price'], span.amount")
            .first()
            .text()
            .trim();
          const image =
            $(el).find("img[class*='product']").attr("src") ||
            $(el).find("img").first().attr("src") ||
            null;

          if (title && link) {
            results.push({
              title,
              url: link.startsWith("http")
                ? link
                : `https://www.reliancedigital.in${link}`,
              price: parsePrice(priceText),
              image,
              store: this.storeId,
            });
          }
        },
      );
    } catch {
      // Return whatever we collected
    }
    return results;
  }
}
