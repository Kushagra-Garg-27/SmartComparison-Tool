/**
 * Generic Fallback Detector
 *
 * Handles unknown e-commerce sites using heuristic scoring.
 * Scores a page based on signals (cart button, price, schema, etc.)
 * and only returns a product if the confidence threshold is met.
 *
 * This detector runs LAST in the pipeline — only if no platform-specific
 * detector matched.
 */

import { DetectedProduct, PlatformDetector } from "./types";
import { extractPrice, getText, getMeta } from "./utils";
import { extractSchemaProduct, schemaToDetectedProduct } from "./schemaOrg";

const CONFIDENCE_THRESHOLD = 5;

export const genericDetector: PlatformDetector = {
  name: "Generic",

  matchUrl(): boolean {
    return true; // Always matches — must be last in pipeline
  },

  extract(doc: Document, url: string): DetectedProduct | null {
    let score = 0;

    // --- Signal: schema.org Product (+4) ---
    const schema = extractSchemaProduct(doc);
    if (schema) score += 4;

    // --- Signal: Add to Cart / Buy button (+3) ---
    const allClickables = doc.querySelectorAll(
      'button, [role="button"], input[type="submit"], a',
    );
    for (const el of allClickables) {
      const text = (el.textContent || "").toLowerCase().trim();
      if (
        text.includes("add to cart") ||
        text.includes("add to bag") ||
        text.includes("buy now") ||
        text.includes("add to basket") ||
        text.includes("purchase") ||
        text.includes("order now")
      ) {
        score += 3;
        break;
      }
    }

    // --- Signal: Price in Open Graph meta (+3) ---
    const ogPrice =
      getMeta(doc, "product:price:amount") || getMeta(doc, "og:price:amount");
    if (ogPrice) score += 3;

    // --- Signal: Visible currency + number pattern (+2) ---
    // Sample a chunk of page text (not the entire body for performance)
    const mainContent = doc.querySelector(
      'main, [role="main"], #content, .product, article',
    );
    const sampleText =
      (mainContent || doc.body)?.textContent?.slice(0, 5000) || "";
    if (/[$₹£€¥]\s*[\d,]+(?:\.\d{2})?/.test(sampleText)) {
      score += 2;
    }

    // --- Signal: Product image with alt text (+2) ---
    const images = doc.querySelectorAll(
      'main img[alt], [role="main"] img[alt], .product img[alt]',
    );
    for (const img of images) {
      const alt = img.getAttribute("alt") || "";
      if (alt.length > 10) {
        score += 2;
        break;
      }
    }

    // --- Signal: Reviews / Ratings section (+1) ---
    const reviewKeywords = [
      "review",
      "rating",
      "stars",
      "customer feedback",
      "testimonial",
    ];
    const headings = doc.querySelectorAll(
      "h1, h2, h3, h4, section[id], div[id]",
    );
    for (const h of headings) {
      const text = (
        (h as HTMLElement).id +
        " " +
        (h.textContent || "")
      ).toLowerCase();
      if (reviewKeywords.some((kw) => text.includes(kw))) {
        score += 1;
        break;
      }
    }

    // --- Score check ---
    if (score < CONFIDENCE_THRESHOLD) return null;

    // --- Extract product data ---
    const schemaData = schema
      ? schemaToDetectedProduct(schema, url, "Generic")
      : {};

    // Title: schema → og:title → first h1
    const title =
      schemaData.title ||
      getMeta(doc, "og:title") ||
      getText(doc, ["h1"]) ||
      getMeta(doc, "title");

    if (!title) return null;

    // Price: schema → Open Graph → null
    let price: number | null = schemaData.price ?? null;
    let currency: string = schemaData.currency || "USD";

    if (price === null && ogPrice) {
      const p = parseFloat(ogPrice);
      if (!isNaN(p) && p > 0) {
        price = p;
        currency =
          getMeta(doc, "product:price:currency") ||
          getMeta(doc, "og:price:currency") ||
          "USD";
      }
    }

    // Image
    const image = schemaData.image || getMeta(doc, "og:image");

    // Platform name from hostname
    let platform = "Direct";
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      const parts = hostname.split(".");
      platform = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch {
      /* use default */
    }

    return {
      title,
      price,
      currency,
      platform,
      externalId: schemaData.externalId || null,
      gtin: schemaData.gtin || null,
      brand: schemaData.brand || null,
      image: image || null,
      url,
      rating: schemaData.rating ?? null,
      reviewCount: schemaData.reviewCount ?? null,
      confidence: "low",
    };
  },
};
