/**
 * Shared utility functions for product detection.
 * Handles price parsing, meta tag reading, and DOM text extraction.
 */

/**
 * Extracts a numeric price and currency from a text string.
 * Handles international formats: "$1,299.00", "₹52,999", "€1.299,00", "¥129,800"
 */
export function extractPrice(
  text: string | null | undefined,
): { price: number; currency: string } | null {
  if (!text) return null;

  let currency = "USD";
  if (text.includes("₹")) currency = "INR";
  else if (text.includes("£")) currency = "GBP";
  else if (text.includes("€")) currency = "EUR";
  else if (text.includes("¥") || text.includes("￥")) currency = "JPY";
  else if (text.includes("$")) currency = "USD";

  const cleaned = text.replace(/[^\d.,]/g, "");
  if (!cleaned) return null;

  let price: number;

  if (cleaned.includes(".") && cleaned.includes(",")) {
    if (cleaned.lastIndexOf(".") > cleaned.lastIndexOf(",")) {
      // Format: 1,299.00 → comma is thousands separator
      price = parseFloat(cleaned.replace(/,/g, ""));
    } else {
      // Format: 1.299,00 → period is thousands, comma is decimal
      price = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
    }
  } else if (cleaned.includes(",")) {
    const parts = cleaned.split(",");
    if (parts[parts.length - 1].length <= 2) {
      // Likely decimal: 12,99
      price = parseFloat(cleaned.replace(",", "."));
    } else {
      // Likely thousands: 1,299 or 52,999
      price = parseFloat(cleaned.replace(/,/g, ""));
    }
  } else {
    price = parseFloat(cleaned);
  }

  if (isNaN(price) || price <= 0) return null;
  return { price, currency };
}

/**
 * Extracts content from a meta tag by property or name attribute.
 */
export function getMeta(doc: Document, attr: string): string | null {
  const el =
    (doc.querySelector(`meta[property="${attr}"]`) as HTMLMetaElement) ||
    (doc.querySelector(`meta[name="${attr}"]`) as HTMLMetaElement);
  return el?.content?.trim() || null;
}

/**
 * Returns the trimmed text content of the first matching element.
 */
export function getText(doc: Document, selectors: string[]): string | null {
  for (const sel of selectors) {
    try {
      const el = doc.querySelector(sel);
      const text = el?.textContent?.trim();
      if (text) return text;
    } catch {
      // Invalid selector — skip
      continue;
    }
  }
  return null;
}

/**
 * Extracts a numeric star rating from text like "4.5 out of 5 stars".
 */
export function extractRating(text: string | null): number | null {
  if (!text) return null;
  const explicit = text.match(/([\d.]+)\s*(?:out of|\/)\s*[\d.]+/i);
  if (explicit) {
    const val = parseFloat(explicit[1]);
    if (val > 0 && val <= 5) return val;
  }
  const simple = text.match(/([\d.]+)/);
  if (simple) {
    const val = parseFloat(simple[1]);
    if (val > 0 && val <= 5) return val;
  }
  return null;
}

/**
 * Extracts a count from text like "1,234 ratings" or "(567 reviews)".
 */
export function extractCount(text: string | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/,/g, "");
  const match = cleaned.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}
