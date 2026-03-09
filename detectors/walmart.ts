/**
 * Walmart Product Page Detector
 * Supports: walmart.com
 * Walmart uses Next.js — product data may also be in __NEXT_DATA__.
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

export const walmartDetector: PlatformDetector = {
  name: "Walmart",

  matchUrl(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname.includes("walmart.com");
    } catch {
      return false;
    }
  },

  extract(doc: Document, url: string): DetectedProduct | null {
    // Walmart product URLs: /ip/PRODUCT-NAME/ITEM-ID or /ip/ITEM-ID
    const ipMatch = url.match(/\/ip\/[^/]+\/(\d+)/);
    const ipMatch2 = url.match(/\/ip\/(\d+)/);
    const itemId = ipMatch?.[1] || ipMatch2?.[1] || null;

    if (!itemId && !url.includes("/ip/")) return null;

    // --- Schema.org (reliable on Walmart) ---
    const schema = extractSchemaProduct(doc);
    const schemaData = schema
      ? schemaToDetectedProduct(schema, url, "Walmart")
      : {};

    // --- Try __NEXT_DATA__ for server-rendered data ---
    let nextData: any = null;
    try {
      const nextScript = doc.getElementById("__NEXT_DATA__");
      if (nextScript?.textContent) {
        nextData = JSON.parse(nextScript.textContent);
      }
    } catch {
      /* ignore */
    }

    // --- Title ---
    const title =
      getText(doc, [
        'h1[itemprop="name"]',
        "#main-title",
        "h1.prod-ProductTitle",
        '[data-testid="product-title"]',
        "h1.f3",
        "h1.lh-copy",
      ]) ||
      schemaData.title ||
      getMeta(doc, "og:title");

    if (!title) return null;

    // --- Price ---
    const priceText = getText(doc, [
      '[data-testid="price-wrap"] [itemprop="price"]',
      'span[itemprop="price"]',
      '[data-automation-id="product-price"] .f1',
      ".price-characteristic",
      'span[data-testid="price-value"]',
      'span.inline-flex [aria-hidden="true"]',
    ]);
    const priceData = extractPrice(priceText);

    // Also try itemprop price attribute
    let attrPrice: number | null = null;
    const priceEl = doc.querySelector('[itemprop="price"]');
    if (priceEl) {
      const content = priceEl.getAttribute("content");
      if (content) {
        const p = parseFloat(content);
        if (!isNaN(p) && p > 0) attrPrice = p;
      }
    }

    // --- Image ---
    const imageEl = doc.querySelector(
      '[data-testid="hero-image"] img, .hover-zoom-hero-image img, img.db',
    ) as HTMLImageElement;
    const image = imageEl?.src || getMeta(doc, "og:image");

    // --- Rating ---
    const ratingAttr = doc
      .querySelector(".stars-container")
      ?.getAttribute("aria-label");
    const ratingText = getText(doc, [
      '[data-testid="product-ratings"] .f7',
      "span.rating-number",
    ]);
    const rating = extractRating(ratingAttr || ratingText);

    // --- Review count ---
    const reviewText = getText(doc, [
      '[itemprop="ratingCount"]',
      '[data-testid="reviews-count"]',
      "a.f7.rating-number",
    ]);
    const reviewCount = extractCount(reviewText);

    // --- Brand ---
    const brandText = getText(doc, [
      'a[data-testid="product-brand"]',
      ".prod-brandName a",
      '[itemprop="brand"]',
      "a.f6.mid-gray",
    ]);
    const brand = brandText || schemaData.brand || null;

    return {
      title,
      price: priceData?.price ?? attrPrice ?? schemaData.price ?? null,
      currency: priceData?.currency || schemaData.currency || "USD",
      platform: "Walmart",
      externalId: itemId || schemaData.externalId || null,
      gtin: schemaData.gtin || null,
      brand,
      image: image || schemaData.image || null,
      url,
      rating: rating ?? schemaData.rating ?? null,
      reviewCount: reviewCount ?? schemaData.reviewCount ?? null,
      confidence: itemId ? "high" : schema ? "medium" : "low",
    };
  },
};
