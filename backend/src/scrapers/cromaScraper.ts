/**
 * Croma Scraper — Extracts product data from Croma.com
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

export class CromaScraper implements StoreScraper {
  readonly storeId = "croma";

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
        $("h1.pd-title").text().trim() ||
        $("h1.product-title").text().trim() ||
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
          "span.amount",
          "span.pdp-price",
          "span.new-price",
          "span.price-value",
          "div.pd-price span",
          "[class*='price'] span",
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
          $("span.old-price").first().text().trim() ||
          $("span.pdp-mrp").first().text().trim() ||
          $("span.list-price").first().text().trim();
        result.originalPrice = parsePrice(mrpText);
      }

      // Meta tag fallback for price
      if (!result.price) {
        const metaPrice =
          $('meta[property="product:price:amount"]').attr("content") ||
          $('meta[property="og:price:amount"]').attr("content");
        if (metaPrice) {
          result.price = parseFloat(metaPrice) || null;
          result.currency =
            $('meta[property="product:price:currency"]').attr("content") || "INR";
          result.extractedVia = "meta";
        }
      }

      // Availability
      const stockText = $("div.pd-inStock, span.in-stock, div.stock-status")
        .text()
        .toLowerCase();
      result.availability =
        stockText.includes("in stock") ||
        stockText.includes("available") ||
        result.price !== null;

      // Image
      result.image =
        $("img.pd-image").attr("src") ||
        $("img.product-img").attr("src") ||
        $('meta[property="og:image"]').attr("content") ||
        null;

      // Seller — Croma is typically the seller
      result.seller = "Croma";

      // Rating
      const ratingText = $("span.rating-value, div.product-rating span")
        .first()
        .text()
        .trim();
      const ratingVal = parseFloat(ratingText);
      result.rating = isNaN(ratingVal) ? null : ratingVal;

      result.deliveryInfo = "Free delivery available";
      result.returnPolicy = "14-day return policy";

    } catch (err) {
      result.error = err instanceof Error ? err.message : String(err);
    }

    return result;
  }

  async searchProducts(query: string, limit = 5): Promise<ScraperSearchResult[]> {
    const results: ScraperSearchResult[] = [];
    try {
      const searchUrl = `https://www.croma.com/searchB?q=${encodeURIComponent(query)}%3Arelevance&text=${encodeURIComponent(query)}`;
      const html = await safeFetch(searchUrl);
      const $ = cheerio.load(html);

      $("div.product-item, li.product-item, div.product-card").each((_i, el) => {
        if (results.length >= limit) return false;

        const title =
          $(el).find("h3.product-title a, a.product-title").text().trim() ||
          $(el).find("a[class*='product']").text().trim();
        const link =
          $(el).find("h3.product-title a, a.product-title").attr("href") ||
          $(el).find("a").first().attr("href");
        const priceText = $(el).find("span.amount, span.price").first().text().trim();
        const image =
          $(el).find("img.product-img, img.product-image").attr("src") || null;

        if (title && link) {
          results.push({
            title,
            url: link.startsWith("http") ? link : `https://www.croma.com${link}`,
            price: parsePrice(priceText),
            image,
            store: this.storeId,
          });
        }
      });
    } catch {
      // Return whatever we collected
    }
    return results;
  }
}
