/**
 * SmartCompare Chrome Extension — Content Script
 *
 * Injected into supported e-commerce product pages.
 * Detects product information from the page DOM and sends it
 * to the background service worker.
 *
 * This script runs in the page context — no React, no imports at runtime.
 * It is bundled as an IIFE by the build step.
 */

import { detectProduct } from "./detectors/index.js";
import type { DetectedProduct } from "./types.js";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const BADGE_ID = "smartcompare-badge";
const DETECTION_DELAY_MS = 1500; // Wait for dynamic content to load

/* ------------------------------------------------------------------ */
/* Badge UI (injected into the page)                                   */
/* ------------------------------------------------------------------ */

function injectBadge(product: DetectedProduct): void {
  // Remove existing badge if any
  document.getElementById(BADGE_ID)?.remove();

  const badge = document.createElement("div");
  badge.id = BADGE_ID;
  badge.setAttribute(
    "style",
    `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483647;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    display: flex;
    align-items: center;
    gap: 10px;
    transition: transform 0.2s, box-shadow 0.2s;
    user-select: none;
  `.trim(),
  );

  const priceText = product.price
    ? ` — ${product.currency} ${product.price.toFixed(2)}`
    : "";

  badge.innerHTML = `
    <span style="font-size:18px">🔍</span>
    <span>
      <strong>SmartCompare</strong><br/>
      <span style="font-size:12px;opacity:0.9">
        ${escapeHtml(truncate(product.title, 40))}${escapeHtml(priceText)}
      </span>
    </span>
  `;

  badge.addEventListener("mouseenter", () => {
    badge.style.transform = "scale(1.05)";
    badge.style.boxShadow = "0 6px 24px rgba(99, 102, 241, 0.5)";
  });
  badge.addEventListener("mouseleave", () => {
    badge.style.transform = "scale(1)";
    badge.style.boxShadow = "0 4px 20px rgba(99, 102, 241, 0.4)";
  });

  badge.addEventListener("click", () => {
    const runtime = (globalThis as unknown as { chrome?: any }).chrome?.runtime;
    if (!runtime?.sendMessage) return;
    try {
      runtime.sendMessage({ type: "OPEN_SIDE_PANEL" }, () => {
        // Ignore runtime errors (e.g., extension reloaded)
        void runtime?.lastError;
      });
    } catch {
      // No-op: extension context may be invalidated during reload
    }
  });

  document.body.appendChild(badge);
}

/* ------------------------------------------------------------------ */
/* Utility                                                             */
/* ------------------------------------------------------------------ */

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ------------------------------------------------------------------ */
/* Main detection flow                                                 */
/* ------------------------------------------------------------------ */

function runDetection(): void {
  const product = detectProduct();
  if (!product) return;

  // Send detected product to background
  {
    const runtime = (globalThis as unknown as { chrome?: any }).chrome?.runtime;
    if (!runtime?.sendMessage) {
      // Not running in an extension content-script context.
      return;
    }
    try {
      runtime.sendMessage(
        {
          type: "PRODUCT_DETECTED",
          payload: product,
        },
        () => {
          void runtime?.lastError;
        },
      );
    } catch {
      // No-op
    }
  }

  // Inject floating badge
  injectBadge(product);
}

// Wait for dynamic page content before detecting
setTimeout(runDetection, DETECTION_DELAY_MS);

// Re-detect on SPA navigation (e.g. Amazon variant switches)
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(runDetection, DETECTION_DELAY_MS);
  }
});
observer.observe(document.body, { childList: true, subtree: true });
