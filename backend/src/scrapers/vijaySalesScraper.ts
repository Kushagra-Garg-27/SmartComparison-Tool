/**
 * Vijay Sales Scraper — Extracts product data from vijaysales.com
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

export class VijaySalesScraper implements StoreScraper {
  readonly storeId = "vijay-sales";

  async scrapeProduct(url: string): Promise<ScraperResult> {
    const result = createBaseResult(this.storeId, url);

    try {
      const html = await safeFetch(url);
      const $ = cheerio.load(html);

      // Extract product ID from URL
      const pidMatch = url.match(/-(\d+)(?:\.html)?$/);
      result.externalId = pidMatch?.[1] ?? null;

      // Title
      result.title =
        $("h1.product-name, h1.product-title").text().trim() ||
        $("h1[class*='pdp']").text().trim() ||
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
          "span.product-price",
          "span.special-price .price",
          "span[class*='offer-price']",
          "div.price-box span.price",
          "span.price",
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
          $("span.old-price .price, span[class*='mrp']").first().text().trim() ||
          $("span.regular-price .price").first().text().trim();
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
      const stockText = $("div.stock, span[class*='availability']")
        .text()
        .toLowerCase();
      result.availability =
        !stockText.includes("out of stock") && result.price !== null;

      // Image
      result.image =
        $("img.product-image-photo").attr("src") ||
        $("img[class*='gallery']").first().attr("src") ||
        $('meta[property="og:image"]').attr("content") ||
        null;

      // Seller — Vijay Sales is the seller
      result.seller = "Vijay Sales";

      result.deliveryInfo = "Free delivery on select products";
      result.returnPolicy = "7-day return policy";

    } catch (err) {
      result.error = err instanceof Error ? err.message : String(err);
    }

    return result;
  }

  async searchProducts(query: string, limit = 5): Promise<ScraperSearchResult[]> {
    const results: ScraperSearchResult[] = [];
    try {
      const searchUrl = `https://www.vijaysales.com/search/${encodeURIComponent(query)}`;
      const html = await safeFetch(searchUrl);
      const $ = cheerio.load(html);

      $("div.product-item, div[class*='product-card'], li.product-item").each(
        (_i, el) => {
          if (results.length >= limit) return false;

          const title =
            $(el).find("a.product-item-link, a.product-name").text().trim() ||
            $(el).find("h2 a, h3 a").text().trim();
          const link =
            $(el).find("a.product-item-link, a.product-name").attr("href") ||
            $(el).find("a").first().attr("href");
          const priceText = $(el)
            .find("span.price, span.special-price .price")
            .first()
            .text()
            .trim();
          const image =
            $(el).find("img.product-image-photo").attr("src") ||
            $(el).find("img").first().attr("src") ||
            null;

          if (title && link) {
            results.push({
              title,
              url: link.startsWith("http")
                ? link
                : `https://www.vijaysales.com${link}`,
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
