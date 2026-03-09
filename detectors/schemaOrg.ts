/**
 * Schema.org JSON-LD Product extraction.
 * Works across all e-commerce platforms that implement structured data.
 * This is the most reliable cross-platform extraction method.
 */

import { DetectedProduct } from "./types";

interface SchemaOffer {
  price?: number | string;
  priceCurrency?: string;
  url?: string;
  seller?: { name?: string };
  availability?: string;
}

interface SchemaProduct {
  "@type"?: string | string[];
  name?: string;
  brand?: string | { name?: string; "@type"?: string };
  image?: string | string[] | { url?: string }[];
  sku?: string;
  gtin?: string;
  gtin13?: string;
  gtin12?: string;
  gtin8?: string;
  mpn?: string;
  offers?:
    | SchemaOffer
    | SchemaOffer[]
    | {
        "@type": string;
        offers?: SchemaOffer[];
        price?: string | number;
        priceCurrency?: string;
      };
  aggregateRating?: {
    ratingValue?: number | string;
    reviewCount?: number | string;
    ratingCount?: number | string;
  };
}

/**
 * Parses all <script type="application/ld+json"> blocks to find a Product schema.
 */
export function extractSchemaProduct(doc: Document): SchemaProduct | null {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || "");
      const found = findProductInSchema(data);
      if (found) return found;
    } catch {
      continue;
    }
  }

  return null;
}

function findProductInSchema(data: any): SchemaProduct | null {
  if (!data) return null;

  // Direct Product type
  if (data["@type"] === "Product") return data;

  // Array of types (some sites use ["Product", "ItemPage"])
  if (Array.isArray(data["@type"]) && data["@type"].includes("Product"))
    return data;

  // Array of items
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findProductInSchema(item);
      if (found) return found;
    }
  }

  // @graph pattern (common in WordPress/WooCommerce)
  if (data["@graph"] && Array.isArray(data["@graph"])) {
    for (const item of data["@graph"]) {
      const found = findProductInSchema(item);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Converts a schema.org Product into partial DetectedProduct fields.
 * Used as enrichment — platform-specific detectors merge this with DOM data.
 */
export function schemaToDetectedProduct(
  schema: SchemaProduct,
  url: string,
  platform: string,
): Partial<DetectedProduct> {
  const result: Partial<DetectedProduct> = {};

  if (schema.name) result.title = schema.name;

  // Brand
  if (typeof schema.brand === "string") {
    result.brand = schema.brand;
  } else if (schema.brand?.name) {
    result.brand = schema.brand.name;
  }

  // Image
  if (typeof schema.image === "string") {
    result.image = schema.image;
  } else if (Array.isArray(schema.image) && schema.image.length > 0) {
    const first = schema.image[0];
    result.image =
      typeof first === "string" ? first : (first as any)?.url || null;
  }

  // Identifiers
  result.gtin =
    schema.gtin || schema.gtin13 || schema.gtin12 || schema.gtin8 || null;
  if (schema.sku) result.externalId = schema.sku;

  // Price from offers
  const offer = extractOffer(schema.offers);
  if (offer) {
    if (offer.price !== undefined) {
      const p =
        typeof offer.price === "number"
          ? offer.price
          : parseFloat(String(offer.price));
      if (!isNaN(p) && p > 0) result.price = p;
    }
    if (offer.priceCurrency) result.currency = offer.priceCurrency;
  }

  // Rating
  if (schema.aggregateRating) {
    const rv = schema.aggregateRating.ratingValue;
    if (rv !== undefined) {
      const r = typeof rv === "number" ? rv : parseFloat(String(rv));
      if (!isNaN(r)) result.rating = r;
    }
    const rc =
      schema.aggregateRating.reviewCount || schema.aggregateRating.ratingCount;
    if (rc !== undefined) {
      const c = typeof rc === "number" ? rc : parseInt(String(rc));
      if (!isNaN(c)) result.reviewCount = c;
    }
  }

  return result;
}

function extractOffer(offers: SchemaProduct["offers"]): SchemaOffer | null {
  if (!offers) return null;

  // Direct offer object with price
  if ("price" in offers && (offers as any).price !== undefined)
    return offers as SchemaOffer;

  // Array of offers — take the first
  if (Array.isArray(offers)) return offers[0] || null;

  // AggregateOffer with nested offers array
  if ("offers" in offers && Array.isArray((offers as any).offers)) {
    return (offers as any).offers[0] || null;
  }

  return null;
}
