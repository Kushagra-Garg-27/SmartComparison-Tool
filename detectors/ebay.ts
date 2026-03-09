/**
 * eBay Product Page Detector
 * Supports: ebay.com, ebay.co.uk, ebay.de, etc.
 * Extracts: Item ID, title, price, condition, seller info
 */

import { DetectedProduct, PlatformDetector } from "./types";
import { extractPrice, getText, getMeta, extractRating } from "./utils";
import { extractSchemaProduct, schemaToDetectedProduct } from "./schemaOrg";

export const ebayDetector: PlatformDetector = {
  name: "eBay",

  matchUrl(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return hostname.includes("ebay.");
    } catch {
      return false;
    }
  },

  extract(doc: Document, url: string): DetectedProduct | null {
    // eBay item URLs: /itm/ITEM-TITLE/ITEM-ID or /itm/ITEM-ID
    const itmMatch = url.match(/\/itm\/(?:[^/]+\/)?(\d+)/);
    const itemId = itmMatch?.[1] || null;

    if (!itemId && !url.includes("/itm/")) return null;

    // --- Schema.org ---
    const schema = extractSchemaProduct(doc);
    const schemaData = schema
      ? schemaToDetectedProduct(schema, url, "eBay")
      : {};

    // --- Title ---
    const title =
      getText(doc, [
        "h1.x-item-title__mainTitle span.ux-textspans",
        "h1.x-item-title__mainTitle span",
        "h1#itemTitle",
        "h1.product-title",
        ".x-item-title span.ux-textspans",
      ]) ||
      schemaData.title ||
      getMeta(doc, "og:title");

    if (!title) return null;

    // Clean up "Details about" prefix eBay sometimes adds
    const cleanTitle = title
      .replace(/^Details about\s+/i, "")
      .replace(/^\s*-\s*/, "")
      .trim();

    // --- Price ---
    const priceText = getText(doc, [
      ".x-price-primary span.ux-textspans",
      ".x-price-primary span",
      "#prcIsum",
      ".x-bin-price__content .x-price-primary span.ux-textspans",
      'span[itemprop="price"]',
    ]);
    const priceData = extractPrice(priceText);

    // --- Image ---
    const imageEl = doc.querySelector(
      ".ux-image-carousel-item img, #icImg, .x-photos__hero img, img.ux-image-magnify__image--original",
    ) as HTMLImageElement;
    const image = imageEl?.src || getMeta(doc, "og:image");

    // --- Rating ---
    const ratingText = getText(doc, [
      ".x-star-rating .clipped",
      "span.star-ratings-text",
    ]);
    const rating = extractRating(ratingText) ?? schemaData.rating ?? null;

    // --- GTIN ---
    // eBay sometimes shows product identifiers in the item specifics table
    let gtin = schemaData.gtin || null;
    const specsRows = doc.querySelectorAll(
      ".ux-labels-values__values-content span, .itemAttr td",
    );
    // Look for UPC/EAN/ISBN labels
    const specsLabels = doc.querySelectorAll(
      ".ux-labels-values__labels-content span, .itemAttr th",
    );
    specsLabels.forEach((label, idx) => {
      const labelText = label.textContent?.trim()?.toLowerCase() || "";
      if (
        (labelText.includes("upc") ||
          labelText.includes("ean") ||
          labelText.includes("isbn")) &&
        !gtin
      ) {
        const valueEl = specsRows[idx];
        const val = valueEl?.textContent?.trim();
        if (val && /^\d{8,14}$/.test(val.replace(/\s/g, ""))) {
          gtin = val.replace(/\s/g, "");
        }
      }
    });

    // --- Brand ---
    let brand = schemaData.brand || null;
    specsLabels.forEach((label, idx) => {
      const labelText = label.textContent?.trim()?.toLowerCase() || "";
      if (labelText === "brand" && !brand) {
        brand = specsRows[idx]?.textContent?.trim() || null;
      }
    });

    return {
      title: cleanTitle,
      price: priceData?.price ?? schemaData.price ?? null,
      currency: priceData?.currency || schemaData.currency || "USD",
      platform: "eBay",
      externalId: itemId || schemaData.externalId || null,
      gtin,
      brand,
      image: image || schemaData.image || null,
      url,
      rating,
      reviewCount: schemaData.reviewCount || null,
      confidence: itemId ? "high" : "medium",
    };
  },
};
