/**
 * Flipkart Scraper — Extracts product data from Flipkart.com
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

export class FlipkartScraper implements StoreScraper {
  readonly storeId = "flipkart";

  async scrapeProduct(url: string): Promise<ScraperResult> {
    const result = createBaseResult(this.storeId, url);

    try {
      const html = await safeFetch(url);
      const $ = cheerio.load(html);

      // Extract Flipkart product ID from URL
      const pidMatch = url.match(/pid=([A-Z0-9]+)/i) ||
        url.match(/\/p\/itm([a-zA-Z0-9]+)/);
      result.externalId = pidMatch?.[1] ?? null;

      // Title
      result.title =
        $("span.VU-ZEz").text().trim() ||
        $("h1.yhB1nd span").text().trim() ||
        $("h1._9E25nV").text().trim() ||
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
          "div.Nx9bqj.CxhGGd",
          "div._30jeq3._16Jk6d",
          "div._30jeq3",
          "div.Nx9bqj",
          "[class*='hl05eU'] div.Nx9bqj",
        ];

        for (const sel of priceSelectors) {
          const text = $(sel).first().text().trim();
          const price = parsePrice(text);
          if (price) {
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
          $("div.yRaY8j.A6\\+E6v").first().text().trim() ||
          $("div._3I9_wc._2p6lqe").first().text().trim() ||
          $("div.yRaY8j").first().text().trim();
        result.originalPrice = parsePrice(mrpText);
      }

      // Availability
      const notAvailable =
        $("div._16FRp0").text().toLowerCase().includes("sold out") ||
        $("div._16FRp0").text().toLowerCase().includes("coming soon");
      result.availability = !notAvailable;

      // Image
      result.image =
        $("img._396cs4._2amPTt._3qGmMb").attr("src") ||
        $("img._53J8C-").attr("src") ||
        $("img.DByuf4").attr("src") ||
        $("img[loading='eager']").first().attr("src") ||
        null;

      // Seller
      result.seller =
        $("div#sellerName span span").text().trim() ||
        $("div._1RLviB span").text().trim() ||
        null;

      // Rating
      const ratingText =
        $("div._3LWZlK").first().text().trim() ||
        $("div.XQDdHH").first().text().trim();
      const ratingVal = parseFloat(ratingText);
      result.rating = isNaN(ratingVal) ? null : ratingVal;

      // Review count
      const reviewCountText =
        $("span._2_R_DZ span").first().text().trim() ||
        $("span.Wphh3N span").first().text().trim();
      const reviewMatch = reviewCountText.match(/([\d,]+)\s*(ratings|reviews)/i);
      result.reviewCount = reviewMatch
        ? parseInt(reviewMatch[1].replace(/,/g, ""), 10)
        : null;

      // Delivery
      result.deliveryInfo =
        $("div._3XINqE").text().trim() || null;
      result.returnPolicy =
        $("div._3n2pMR").text().trim() || null;

    } catch (err) {
      result.error = err instanceof Error ? err.message : String(err);
    }

    return result;
  }

  async searchProducts(query: string, limit = 5): Promise<ScraperSearchResult[]> {
    const results: ScraperSearchResult[] = [];
    try {
      const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
      const html = await safeFetch(searchUrl);
      const $ = cheerio.load(html);

      $("div._1AtVbE, div.tUxRFH, div._75nlfW").each((_i, el) => {
        if (results.length >= limit) return false;

        const titleEl = $(el).find("div._4rR01T, a.s1Q9rs, a.IRpwTa");
        const title = titleEl.text().trim();
        const link = titleEl.attr("href") || $(el).find("a").first().attr("href");
        const priceText = $(el).find("div._30jeq3, div.Nx9bqj").first().text().trim();
        const image = $(el).find("img._396cs4, img.DByuf4").attr("src") || null;

        if (title && link) {
          results.push({
            title,
            url: link.startsWith("http")
              ? link
              : `https://www.flipkart.com${link}`,
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
