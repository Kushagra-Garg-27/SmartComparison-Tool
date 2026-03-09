/**
 * Flipkart Product Page Detector
 * Note: Flipkart uses obfuscated CSS class names that change periodically.
 * Schema.org is the primary extraction method; DOM selectors are fallback.
 */

import { DetectedProduct, PlatformDetector } from "./types";
import {
  extractPrice,
  getText,
  getMeta,
  extractRating,
  extractCount,
} from "./utils";
import { extractSchemaProduct, schemaToDetectedProduct } from "./schemaOrg";

export const flipkartDetector: PlatformDetector = {
  name: "Flipkart",

  matchUrl(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname.includes("flipkart.com");
    } catch {
      return false;
    }
  },

  extract(doc: Document, url: string): DetectedProduct | null {
    // Flipkart product URLs contain /p/ with a pid query param or path segment
    const pidMatch = url.match(/[?&]pid=([^&]+)/);
    const pathMatch = url.match(/\/p\/([a-z0-9]+)/i);

    // Must be a product page
    if (!pidMatch && !pathMatch && !url.includes("/p/")) return null;

    const productId = pidMatch?.[1] || pathMatch?.[1] || null;

    // --- Schema.org (most reliable for Flipkart) ---
    const schema = extractSchemaProduct(doc);
    const schemaData = schema
      ? schemaToDetectedProduct(schema, url, "Flipkart")
      : {};

    // --- Title ---
    const title =
      getText(doc, [
        "h1 span",
        "h1.yhB1nd",
        "h1._9E25nV",
        ".B_NuCI",
        "._35KyD6",
        "h1[class]",
      ]) ||
      schemaData.title ||
      getMeta(doc, "og:title") ||
      getMeta(doc, "title");

    if (!title) return null;

    // --- Price ---
    const priceText = getText(doc, [
      "div._30jeq3",
      "div._16Jk6d",
      "div.Nx9bqj",
      "div._25b18c div._30jeq3",
      'div[class*="CxhGGd"]',
    ]);
    const priceData = extractPrice(priceText);

    // --- Image ---
    const imageEl = doc.querySelector(
      "img._396cs4, img._2r_T1I, img.DByuf4, img._53J4C-, img.q6DClP, div._3kidJX img",
    ) as HTMLImageElement;
    const image = imageEl?.src || getMeta(doc, "og:image");

    // --- Rating ---
    const ratingText = getText(doc, [
      "div._3LWZlK",
      "div.XQDdHH",
      "span._1lRcqv div._3LWZlK",
      'div[class*="hGQGap"]',
    ]);
    const rating = extractRating(ratingText);

    // --- Review count ---
    const ratingCountText = getText(doc, [
      "span._2_R_DZ",
      "span.Wphh3N",
      'span[class*="AxMMck"]',
    ]);
    const reviewCount = extractCount(ratingCountText);

    // --- Brand ---
    const brand = schemaData.brand || null;

    return {
      title,
      price: priceData?.price ?? schemaData.price ?? null,
      currency: priceData?.currency || schemaData.currency || "INR",
      platform: "Flipkart",
      externalId: productId || schemaData.externalId || null,
      gtin: schemaData.gtin || null,
      brand,
      image: image || schemaData.image || null,
      url,
      rating: rating ?? schemaData.rating ?? null,
      reviewCount: reviewCount ?? schemaData.reviewCount ?? null,
      confidence: productId ? "high" : schema ? "medium" : "low",
    };
  },
};
