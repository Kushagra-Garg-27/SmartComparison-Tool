/**
 * BestBuy Product Page Detector
 * Supports: bestbuy.com
 * Extracts: SKU, title, price, rating, reviews, brand, image
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

export const bestbuyDetector: PlatformDetector = {
  name: "BestBuy",

  matchUrl(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname.includes("bestbuy.com");
    } catch {
      return false;
    }
  },

  extract(doc: Document, url: string): DetectedProduct | null {
    // BestBuy product URLs: /site/PRODUCT-NAME/SKU.p
    const skuMatch = url.match(/\/(\d{7})\.p/);
    const sku = skuMatch?.[1] || null;

    if (!sku && !url.includes(".p")) return null;

    // --- Schema.org ---
    const schema = extractSchemaProduct(doc);
    const schemaData = schema
      ? schemaToDetectedProduct(schema, url, "BestBuy")
      : {};

    // --- Title ---
    const title =
      getText(doc, [
        ".sku-title h1",
        "h1.heading-5.v-fw-regular",
        '[data-testid="heading-product-name"]',
        "div.sku-title",
        'h1[class*="heading"]',
      ]) ||
      schemaData.title ||
      getMeta(doc, "og:title");

    if (!title) return null;

    // --- Price ---
    const priceText = getText(doc, [
      '.priceView-hero-price span[aria-hidden="true"]',
      ".priceView-customer-price span",
      '[data-testid="customer-price"] span',
      ".pricing-price__regular-price",
      '.price-box span[aria-hidden="true"]',
    ]);
    const priceData = extractPrice(priceText);

    // --- SKU from page (backup) ---
    const skuText = getText(doc, [".sku-value", '[data-testid="sku-value"]']);
    const pageSku = skuText?.replace(/[^\d]/g, "") || null;

    // --- Image ---
    const imageEl = doc.querySelector(
      ".primary-image img, .shop-media-gallery img, picture.product-image img, img.primary-image",
    ) as HTMLImageElement;
    const image = imageEl?.src || getMeta(doc, "og:image");

    // --- Rating ---
    const ratingAttr = doc
      .querySelector(".c-ratings-reviews .c-stars")
      ?.getAttribute("aria-label");
    const ratingText = getText(doc, [
      ".ugc-rating-stars .c-reviews",
      ".c-ratings-reviews .c-stars-v4",
    ]);
    const rating =
      extractRating(ratingAttr || ratingText) ?? schemaData.rating ?? null;

    // --- Review count ---
    const reviewText = getText(doc, [
      ".c-ratings-reviews .c-total-reviews",
      '[data-testid="ratings-count"]',
      ".ugc-c-review-average span",
    ]);
    const reviewCount =
      extractCount(reviewText) ?? schemaData.reviewCount ?? null;

    // --- Brand ---
    const brand =
      getText(doc, [
        "a.sku-title-brand-link",
        '[data-testid="product-brand-link"]',
        ".brand-link a",
      ]) ||
      schemaData.brand ||
      null;

    return {
      title,
      price: priceData?.price ?? schemaData.price ?? null,
      currency: priceData?.currency || schemaData.currency || "USD",
      platform: "BestBuy",
      externalId: sku || pageSku || schemaData.externalId || null,
      gtin: schemaData.gtin || null,
      brand,
      image: image || schemaData.image || null,
      url,
      rating,
      reviewCount,
      confidence: sku || pageSku ? "high" : schema ? "medium" : "low",
    };
  },
};
