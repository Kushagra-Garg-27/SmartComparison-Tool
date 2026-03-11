/**
 * SmartCompare Chrome Extension — Popup UI
 *
 * Minimal popup shown when clicking the extension icon.
 * Displays detected product summary and quick actions.
 */

import type {
  DetectedProduct,
  IdentifyResponse,
  ExtensionResponse,
} from "./types.js";

/* ------------------------------------------------------------------ */
/* DOM helpers                                                         */
/* ------------------------------------------------------------------ */

const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T | null;

function el(
  tag: string,
  attrs?: Record<string, string>,
  ...children: (string | HTMLElement)[]
): HTMLElement {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  }
  for (const child of children) {
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

/* ------------------------------------------------------------------ */
/* Main render                                                         */
/* ------------------------------------------------------------------ */

async function init() {
  const root = $("popup-root");
  if (!root) return;

  root.innerHTML = "";
  root.appendChild(renderHeader());

  // Get detected product from background
  const response = await sendMessage<DetectedProduct | null>({
    type: "GET_DETECTED_PRODUCT",
  });

  if (!response.success || !response.data) {
    root.appendChild(renderEmptyState());
    return;
  }

  const product = response.data;
  root.appendChild(renderProductCard(product));

  // Try to identify and show quick comparison
  root.appendChild(renderLoading("Checking prices…"));
  const identifyResp = await sendMessage<IdentifyResponse>({
    type: "IDENTIFY_PRODUCT",
    payload: product,
  });
  root.querySelector(".loading")?.remove();

  if (identifyResp.success && identifyResp.data) {
    root.appendChild(renderQuickComparison(identifyResp.data));
  } else {
    root.appendChild(
      el(
        "p",
        { class: "error" },
        identifyResp.success ? "Unknown error" : identifyResp.error,
      ),
    );
  }

  // Open panel button
  root.appendChild(renderOpenPanelButton());
}

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

function renderHeader(): HTMLElement {
  const header = el("div", { class: "header" });
  header.innerHTML = `
    <div class="logo">🔍 <strong>SmartCompare</strong> Pro</div>
    <div class="subtitle">Real-time price comparison</div>
  `;
  return header;
}

function renderEmptyState(): HTMLElement {
  const div = el("div", { class: "empty-state" });
  div.innerHTML = `
    <p class="empty-icon">🛒</p>
    <p><strong>No product detected</strong></p>
    <p class="muted">Navigate to a product page on Amazon, eBay, Walmart, Best Buy, or Flipkart.</p>
  `;
  return div;
}

function renderProductCard(product: DetectedProduct): HTMLElement {
  const card = el("div", { class: "product-card" });
  const priceStr = product.price
    ? `${product.currency} ${product.price.toFixed(2)}`
    : "Price not detected";

  card.innerHTML = `
    ${product.image ? `<img class="product-img" src="${escapeAttr(product.image)}" alt="" />` : ""}
    <div class="product-info">
      <div class="product-title">${escapeHtml(truncate(product.title, 60))}</div>
      <div class="product-price">${escapeHtml(priceStr)}</div>
      <div class="product-platform badge">${escapeHtml(product.platform)}</div>
    </div>
  `;
  return card;
}

function renderQuickComparison(data: IdentifyResponse): HTMLElement {
  const section = el("div", { class: "comparison" });
  if (!data.listings.length) {
    section.innerHTML = `<p class="muted">No alternative listings found yet.</p>`;
    return section;
  }

  const sorted = [...data.listings].sort(
    (a, b) => a.price - b.price,
  );
  const lowest = sorted[0];

  section.innerHTML = `
    <div class="section-title">💰 Best Price Found</div>
    <div class="best-price-card">
      <div class="best-price">${escapeHtml(lowest.currency)} ${lowest.price.toFixed(2)}</div>
      <div class="best-platform badge">${escapeHtml(lowest.storeDisplayName || lowest.store || "Unknown")}</div>
      <div class="best-seller muted">${escapeHtml(lowest.seller)}</div>
    </div>
    <div class="listing-count muted">${data.listings.length} listing(s) found across platforms</div>
  `;
  return section;
}

function renderLoading(text: string): HTMLElement {
  const div = el("div", { class: "loading" });
  div.innerHTML = `<span class="spinner"></span> ${escapeHtml(text)}`;
  return div;
}

function renderOpenPanelButton(): HTMLElement {
  const btn = el("button", { class: "panel-btn" }, "Open Full Comparison ➜");
  btn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
    window.close();
  });
  return btn;
}

/* ------------------------------------------------------------------ */
/* Messaging                                                           */
/* ------------------------------------------------------------------ */

let didAutoReloadForInvalidation = false;

function sendMessage<T>(message: unknown): Promise<ExtensionResponse<T>> {
  return new Promise((resolve) => {
    if (!globalThis.chrome?.runtime?.sendMessage) {
      resolve({
        success: false,
        error:
          "Extension runtime unavailable (chrome.runtime.sendMessage missing).",
      });
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response: ExtensionResponse<T>) => {
        const lastErr = chrome.runtime?.lastError;
        if (lastErr) {
          const msg = lastErr.message || String(lastErr);
          if (msg.toLowerCase().includes("extension context invalidated")) {
            if (!didAutoReloadForInvalidation) {
              didAutoReloadForInvalidation = true;
              setTimeout(() => {
                try {
                  location.reload();
                } catch {
                  // ignore
                }
              }, 250);
            }
            resolve({
              success: false,
              error:
                "Extension reloaded. Please reopen the popup.",
            });
            return;
          }
          resolve({ success: false, error: msg });
          return;
        }
        resolve(response || { success: false, error: "No response" });
      });
    } catch (err) {
      const msg = String((err as Error | undefined)?.message || err);
      resolve({ success: false, error: msg });
    }
  });
}

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ------------------------------------------------------------------ */
/* Bootstrap                                                           */
/* ------------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", init);
