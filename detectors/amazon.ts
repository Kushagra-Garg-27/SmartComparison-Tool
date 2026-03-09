/**
 * Amazon Product Page Detector
 * Supports: amazon.com, amazon.in, amazon.co.uk, amazon.de, etc.
 * Extracts: ASIN, title, price, rating, reviews, brand, image
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

export const amazonDetector: PlatformDetector = {
  name: "Amazon",

  matchUrl(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname.includes("amazon.");
    } catch {
      return false;
    }
  },

  extract(doc: Document, url: string): DetectedProduct | null {
    // Reject non-product pages early
    if (
      /\/s\?|\/s\/|\/search|\/b\?|\/b\/|\/hz\/wishlist|\/gp\/cart|\/gp\/registry/i.test(
        url,
      )
    ) {
      return null;
    }

    // --- ASIN extraction (URL → DOM fallback) ---
    const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})/i);
    const gpMatch = url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    const asinInput = doc.querySelector(
      'input[name="ASIN"]',
    ) as HTMLInputElement;
    const asin = dpMatch?.[1] || gpMatch?.[1] || asinInput?.value || null;

    // --- Title (mandatory) ---
    const title = getText(doc, [
      "#productTitle",
      "#title span",
      "h1.product-title-word-break",
      "#btAsinTitle span",
    ]);
    if (!title) return null;

    // --- Price ---
    const priceText = getText(doc, [
      "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
      "#corePrice_feature_div .a-price .a-offscreen",
      ".a-price .a-offscreen",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      "#price_inside_buybox",
      "#newBuyBoxPrice",
    ]);
    const priceData = extractPrice(priceText);

    // Currency from symbol element or price string
    const currencySymbol = getText(doc, [".a-price-symbol"]);
    let currency = priceData?.currency || "USD";
    if (currencySymbol === "₹") currency = "INR";
    else if (currencySymbol === "£") currency = "GBP";
    else if (currencySymbol === "€") currency = "EUR";

    // --- Image ---
    const imageEl =
      (doc.getElementById("landingImage") as HTMLImageElement) ||
      (doc.getElementById("imgBlkFront") as HTMLImageElement) ||
      (doc.querySelector(
        "#imageBlock img, #main-image-container img",
      ) as HTMLImageElement);
    const image = imageEl?.src || getMeta(doc, "og:image");

    // --- Rating ---
    const ratingText = getText(doc, [
      "#acrPopover .a-icon-alt",
      "i.a-icon-star span.a-icon-alt",
      '[data-hook="rating-out-of-text"]',
    ]);
    const rating = extractRating(ratingText);

    // --- Review count ---
    const reviewText = getText(doc, [
      "#acrCustomerReviewText",
      '[data-hook="total-review-count"]',
      "#ratings-count span",
    ]);
    const reviewCount = extractCount(reviewText);

    // --- Brand ---
    const brandEl = doc.getElementById("bylineInfo");
    let brand = brandEl?.textContent?.trim() || getMeta(doc, "brand") || null;
    if (brand) {
      brand = brand
        .replace(/^(Brand:\s*|Visit the\s+|Store\s*)/i, "")
        .replace(/\s+Store$/i, "")
        .trim();
    }

    // --- Schema.org enrichment ---
    const schema = extractSchemaProduct(doc);
    const schemaData = schema
      ? schemaToDetectedProduct(schema, url, "Amazon")
      : {};

    return {
      title,
      price: priceData?.price ?? schemaData.price ?? null,
      currency: currency || schemaData.currency || "USD",
      platform: "Amazon",
      externalId: asin || schemaData.externalId || null,
      gtin: schemaData.gtin || null,
      brand: brand || schemaData.brand || null,
      image: image || schemaData.image || null,
      url,
      rating: rating ?? schemaData.rating ?? null,
      reviewCount: reviewCount ?? schemaData.reviewCount ?? null,
      confidence: asin ? "high" : "medium",
    };
  },
};
