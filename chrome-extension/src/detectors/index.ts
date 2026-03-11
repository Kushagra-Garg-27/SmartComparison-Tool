/**
 * Platform-specific product detectors.
 *
 * Each detector attempts to extract product information from a
 * supported e-commerce page using DOM selectors and JSON-LD data.
 */

import type { DetectedProduct } from "../types.js";

/* ------------------------------------------------------------------ */
/* Helper utilities                                                    */
/* ------------------------------------------------------------------ */

function textOf(selector: string): string | null {
  const el = document.querySelector(selector);
  return el?.textContent?.trim() || null;
}

function attrOf(selector: string, attr: string): string | null {
  const el = document.querySelector(selector);
  return el?.getAttribute(attr) || null;
}

function parsePrice(raw: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function getCurrency(): string {
  // Try JSON-LD first
  const ld = getJsonLd();
  if (ld?.priceCurrency) return ld.priceCurrency;
  if (ld?.offers?.priceCurrency) return ld.offers.priceCurrency;

  // Guess from URL
  const host = location.hostname;
  if (host.endsWith(".in")) return "INR";
  if (host.endsWith(".co.uk")) return "GBP";
  return "USD";
}

interface JsonLdProduct {
  name?: string;
  brand?: { name?: string } | string;
  image?: string | string[];
  gtin13?: string;
  gtin?: string;
  sku?: string;
  priceCurrency?: string;
  offers?: {
    price?: string | number;
    priceCurrency?: string;
    url?: string;
  };
}

function getJsonLd(): JsonLdProduct | null {
  const scripts = document.querySelectorAll(
    'script[type="application/ld+json"]',
  );
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || "");
      // May be an array or nested @graph
      const items = Array.isArray(data) ? data : data["@graph"] || [data];
      for (const item of items) {
        if (item["@type"] === "Product" || item["@type"]?.includes("Product")) {
          return item as JsonLdProduct;
        }
      }
    } catch {
      // skip
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Amazon detector                                                     */
/* ------------------------------------------------------------------ */

function detectAmazon(): DetectedProduct | null {
  const title =
    textOf("#productTitle") ||
    textOf("#title span") ||
    textOf('[data-feature-name="title"]');
  if (!title) return null;

  const priceWhole = textOf(".a-price .a-price-whole");
  const priceFraction = textOf(".a-price .a-price-fraction");
  const priceStr =
    priceWhole && priceFraction
      ? `${priceWhole}.${priceFraction}`
      : textOf("#priceblock_ourprice") || textOf("#priceblock_dealprice");

  const image =
    attrOf("#landingImage", "src") || attrOf("#imgBlkFront", "src");
  const brand = textOf("#bylineInfo") || textOf(".po-brand .po-break-word");

  // Try to get ASIN
  const asinMatch = location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
  const externalId = asinMatch?.[1] || null;

  const ld = getJsonLd();
  const gtin = ld?.gtin13 || ld?.gtin || null;

  return {
    title,
    price: parsePrice(priceStr),
    currency: getCurrency(),
    platform: "amazon",
    externalId,
    gtin,
    brand: brand?.replace(/^(Brand:|Visit the|Visit )/, "").trim() || null,
    image,
    url: location.href,
  };
}

/* ------------------------------------------------------------------ */
/* eBay detector                                                       */
/* ------------------------------------------------------------------ */

function detectEbay(): DetectedProduct | null {
  const title =
    textOf("h1.x-item-title__mainTitle span") ||
    textOf('[data-testid="x-item-title"] span');
  if (!title) return null;

  const priceStr =
    textOf(".x-price-primary span") || textOf('[data-testid="x-price-primary"]');
  const image = attrOf(".ux-image-carousel-item img", "src");

  const itemMatch = location.pathname.match(/\/itm\/.*?\/(\d+)/);
  const externalId = itemMatch?.[1] || null;

  const ld = getJsonLd();

  return {
    title,
    price: parsePrice(priceStr),
    currency: getCurrency(),
    platform: "ebay",
    externalId,
    gtin: ld?.gtin13 || ld?.gtin || null,
    brand: null,
    image,
    url: location.href,
  };
}

/* ------------------------------------------------------------------ */
/* Walmart detector                                                    */
/* ------------------------------------------------------------------ */

function detectWalmart(): DetectedProduct | null {
  const title = textOf('[itemprop="name"]') || textOf("h1.prod-ProductTitle");
  if (!title) return null;

  const priceStr =
    textOf('[itemprop="price"]') ||
    textOf('[data-testid="price-wrap"] span');
  const image =
    attrOf('[data-testid="hero-image"] img', "src") ||
    attrOf(".hover-zoom-hero-image img", "src");

  const ld = getJsonLd();

  return {
    title,
    price: parsePrice(priceStr),
    currency: "USD",
    platform: "walmart",
    externalId: null,
    gtin: ld?.gtin13 || ld?.gtin || null,
    brand:
      typeof ld?.brand === "string"
        ? ld.brand
        : ld?.brand?.name || null,
    image,
    url: location.href,
  };
}

/* ------------------------------------------------------------------ */
/* Best Buy detector                                                   */
/* ------------------------------------------------------------------ */

function detectBestBuy(): DetectedProduct | null {
  const title = textOf(".sku-title h1") || textOf("h1.heading-5");
  if (!title) return null;

  const priceStr =
    textOf('.priceView-customer-price span[aria-hidden="true"]') ||
    textOf(".priceView-hero-price span");
  const image = attrOf(".primary-image", "src");

  const skuMatch = location.pathname.match(/\/(\d{7})\./);
  const externalId = skuMatch?.[1] || null;
  const ld = getJsonLd();

  return {
    title,
    price: parsePrice(priceStr),
    currency: "USD",
    platform: "bestbuy",
    externalId,
    gtin: ld?.gtin13 || ld?.gtin || null,
    brand: typeof ld?.brand === "string" ? ld.brand : ld?.brand?.name || null,
    image,
    url: location.href,
  };
}

/* ------------------------------------------------------------------ */
/* Flipkart detector                                                   */
/* ------------------------------------------------------------------ */

function detectFlipkart(): DetectedProduct | null {
  const title = textOf("span.VU-ZEz") || textOf("h1.yhB1nd span");
  if (!title) return null;

  const priceStr = textOf("div.Nx9bqj.CxhGGd") || textOf("div._30jeq3._16Jk6d");
  const image =
    attrOf("img._396cs4._2amPTt._3qGmMb", "src") ||
    attrOf("img.DByuf4", "src");

  const ld = getJsonLd();

  return {
    title,
    price: parsePrice(priceStr),
    currency: "INR",
    platform: "flipkart",
    externalId: null,
    gtin: ld?.gtin13 || ld?.gtin || null,
    brand: typeof ld?.brand === "string" ? ld.brand : ld?.brand?.name || null,
    image,
    url: location.href,
  };
}

/* ------------------------------------------------------------------ */
/* Croma detector                                                      */
/* ------------------------------------------------------------------ */

function detectCroma(): DetectedProduct | null {
  const title =
    textOf("h1.pd-title") ||
    textOf("h1.product-title") ||
    textOf("h1");
  if (!title) return null;

  const priceStr =
    textOf("span.amount") ||
    textOf("span.pdp-price") ||
    textOf("span.new-price") ||
    textOf("span.price-value");
  const image =
    attrOf("img.pd-image", "src") ||
    attrOf("img.product-img", "src") ||
    attrOf('meta[property="og:image"]', "content");

  const ld = getJsonLd();
  const pidMatch = location.pathname.match(/\/p\/(\d+)/);

  return {
    title,
    price: parsePrice(priceStr),
    currency: "INR",
    platform: "croma",
    externalId: pidMatch?.[1] || ld?.sku || null,
    gtin: ld?.gtin13 || ld?.gtin || null,
    brand: typeof ld?.brand === "string" ? ld.brand : ld?.brand?.name || null,
    image,
    url: location.href,
  };
}

/* ------------------------------------------------------------------ */
/* Reliance Digital detector                                           */
/* ------------------------------------------------------------------ */

function detectRelianceDigital(): DetectedProduct | null {
  const title =
    textOf("h1.pdp__title") ||
    textOf("h1[class*='product-title']") ||
    textOf("h1");
  if (!title) return null;

  const priceStr =
    textOf("span.pdp__offerPrice") ||
    textOf("span.pdp__priceSection__priceListText") ||
    textOf("li.pdp__priceSection__price span");
  const image =
    attrOf("img.pdp__image", "src") ||
    attrOf("img[class*='product-image']", "src") ||
    attrOf('meta[property="og:image"]', "content");

  const ld = getJsonLd();
  const pidMatch = location.pathname.match(/\/p\/(\d+)/);

  return {
    title,
    price: parsePrice(priceStr),
    currency: "INR",
    platform: "reliance-digital",
    externalId: pidMatch?.[1] || ld?.sku || null,
    gtin: ld?.gtin13 || ld?.gtin || null,
    brand: typeof ld?.brand === "string" ? ld.brand : ld?.brand?.name || null,
    image,
    url: location.href,
  };
}

/* ------------------------------------------------------------------ */
/* Vijay Sales detector                                                */
/* ------------------------------------------------------------------ */

function detectVijaySales(): DetectedProduct | null {
  const title =
    textOf("h1.product-name") ||
    textOf("h1.product-title") ||
    textOf("h1[class*='pdp']") ||
    textOf("h1");
  if (!title) return null;

  const priceStr =
    textOf("span.product-price") ||
    textOf("span.special-price .price") ||
    textOf("span[class*='offer-price']") ||
    textOf("div.price-box span.price");
  const image =
    attrOf("img.product-image-photo", "src") ||
    attrOf("img[class*='gallery']", "src") ||
    attrOf('meta[property="og:image"]', "content");

  const ld = getJsonLd();
  const pidMatch = location.pathname.match(/-(\d+)(?:\.html)?$/);

  return {
    title,
    price: parsePrice(priceStr),
    currency: "INR",
    platform: "vijay-sales",
    externalId: pidMatch?.[1] || ld?.sku || null,
    gtin: ld?.gtin13 || ld?.gtin || null,
    brand: typeof ld?.brand === "string" ? ld.brand : ld?.brand?.name || null,
    image,
    url: location.href,
  };
}

/* ------------------------------------------------------------------ */
/* Generic / fallback JSON-LD + meta tag detector                      */
/* ------------------------------------------------------------------ */

function detectGeneric(): DetectedProduct | null {
  // Try JSON-LD first
  const ld = getJsonLd();
  if (ld?.name) {
    const priceVal =
      typeof ld.offers?.price === "number"
        ? ld.offers.price
        : parsePrice(String(ld.offers?.price));

    return {
      title: ld.name,
      price: priceVal,
      currency: ld.offers?.priceCurrency || getCurrency(),
      platform: location.hostname.replace("www.", "").split(".")[0],
      externalId: ld.sku || null,
      gtin: ld.gtin13 || ld.gtin || null,
      brand:
        typeof ld.brand === "string" ? ld.brand : ld.brand?.name || null,
      image: Array.isArray(ld.image) ? ld.image[0] : ld.image || null,
      url: location.href,
    };
  }

  // Fallback: meta tags (og:title, product:price, etc.)
  const ogTitle = attrOf('meta[property="og:title"]', "content");
  if (ogTitle) {
    const priceStr =
      attrOf('meta[property="product:price:amount"]', "content") ||
      attrOf('meta[property="og:price:amount"]', "content");
    const currency =
      attrOf('meta[property="product:price:currency"]', "content") ||
      attrOf('meta[property="og:price:currency"]', "content") ||
      getCurrency();
    const image =
      attrOf('meta[property="og:image"]', "content") ||
      attrOf('meta[name="twitter:image"]', "content");
    const brand =
      attrOf('meta[property="product:brand"]', "content") ||
      attrOf('meta[name="brand"]', "content");

    return {
      title: ogTitle,
      price: parsePrice(priceStr),
      currency,
      platform: location.hostname.replace("www.", "").split(".")[0],
      externalId: null,
      gtin: null,
      brand: brand || null,
      image: image || null,
      url: location.href,
    };
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Target detector                                                     */
/* ------------------------------------------------------------------ */

function detectTarget(): DetectedProduct | null {
  const title =
    textOf('[data-test="product-title"]') ||
    textOf("h1[itemprop='name']") ||
    textOf("h1");
  if (!title) return null;

  const priceStr =
    textOf('[data-test="product-price"]') ||
    textOf('[data-test="current-price"] span');
  const image =
    attrOf('[data-test="product-image"] img', "src") ||
    attrOf("picture img", "src") ||
    attrOf('meta[property="og:image"]', "content");

  const ld = getJsonLd();
  const dpciMatch = location.pathname.match(/A-(\d+)/);

  return {
    title,
    price: parsePrice(priceStr),
    currency: "USD",
    platform: "target",
    externalId: dpciMatch?.[1] || ld?.sku || null,
    gtin: ld?.gtin13 || ld?.gtin || null,
    brand: typeof ld?.brand === "string" ? ld.brand : ld?.brand?.name || null,
    image,
    url: location.href,
  };
}

/* ------------------------------------------------------------------ */
/* Newegg detector                                                     */
/* ------------------------------------------------------------------ */

function detectNewegg(): DetectedProduct | null {
  const title =
    textOf("h1.product-title") ||
    textOf("h1[class*='product']") ||
    textOf("h1");
  if (!title) return null;

  const priceStr =
    textOf("li.price-current strong") ||
    textOf(".price-current") ||
    textOf('[itemprop="price"]');
  const image =
    attrOf(".product-view-img-original", "src") ||
    attrOf(".swiper-slide img", "src") ||
    attrOf('meta[property="og:image"]', "content");

  const ld = getJsonLd();
  const itemMatch = location.pathname.match(/\/p\/([A-Z0-9-]+)/i);

  return {
    title,
    price: parsePrice(priceStr),
    currency: "USD",
    platform: "newegg",
    externalId: itemMatch?.[1] || ld?.sku || null,
    gtin: ld?.gtin13 || ld?.gtin || null,
    brand: typeof ld?.brand === "string" ? ld.brand : ld?.brand?.name || null,
    image,
    url: location.href,
  };
}

/* ------------------------------------------------------------------ */
/* Main detection entry point                                          */
/* ------------------------------------------------------------------ */

const DETECTORS: Record<string, () => DetectedProduct | null> = {
  "amazon.com": detectAmazon,
  "amazon.in": detectAmazon,
  "amazon.co.uk": detectAmazon,
  "ebay.com": detectEbay,
  "walmart.com": detectWalmart,
  "bestbuy.com": detectBestBuy,
  "flipkart.com": detectFlipkart,
  "croma.com": detectCroma,
  "reliancedigital.in": detectRelianceDigital,
  "vijaysales.com": detectVijaySales,
  "target.com": detectTarget,
  "newegg.com": detectNewegg,
};

export function detectProduct(): DetectedProduct | null {
  const host = location.hostname.replace("www.", "");

  // Try platform-specific detector first
  const detector = DETECTORS[host];
  if (detector) {
    const result = detector();
    if (result) return result;
  }

  // Fallback to generic JSON-LD + meta tag detection
  return detectGeneric();
}
