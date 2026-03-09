/**
 * Product Detection Pipeline
 *
 * Multi-layer product identification system that runs in the content script.
 * Detectors are tried in order — first match wins.
 *
 * Layer 1: URL pattern matching → selects the correct platform detector
 * Layer 2: Schema.org structured data extraction (inside each detector)
 * Layer 3: Platform-specific DOM selectors
 * Layer 4: Generic heuristic fallback
 */

import { DetectedProduct, PlatformDetector } from "./types";
import { amazonDetector } from "./amazon";
import { flipkartDetector } from "./flipkart";
import { walmartDetector } from "./walmart";
import { ebayDetector } from "./ebay";
import { bestbuyDetector } from "./bestbuy";
import { genericDetector } from "./generic";

/**
 * Ordered list of platform-specific detectors.
 * Generic detector is always last as a fallback.
 */
const detectors: PlatformDetector[] = [
  amazonDetector,
  flipkartDetector,
  walmartDetector,
  ebayDetector,
  bestbuyDetector,
  genericDetector,
];

/**
 * Runs the multi-layer product detection pipeline against the current page.
 *
 * @param doc - The page's Document object
 * @param url - The page's current URL
 * @returns DetectedProduct if a product is found, null otherwise
 */
export function detectProduct(
  doc: Document,
  url: string,
): DetectedProduct | null {
  for (const detector of detectors) {
    if (detector.matchUrl(url)) {
      try {
        const result = detector.extract(doc, url);
        if (result) {
          console.log(
            `[SmartCompare] Product detected by ${detector.name} detector`,
            `(confidence: ${result.confidence})`,
            `| "${result.title?.slice(0, 60)}..."`,
            `| ${result.currency} ${result.price ?? "N/A"}`,
            `| ID: ${result.externalId ?? "none"}`,
          );
          return result;
        }
      } catch (error) {
        console.warn(`[SmartCompare] ${detector.name} detector error:`, error);
        // Continue to next detector — don't let one failure block the pipeline
        continue;
      }
    }
  }

  console.log("[SmartCompare] No product detected on this page.");
  return null;
}

export type { DetectedProduct, PlatformDetector };
