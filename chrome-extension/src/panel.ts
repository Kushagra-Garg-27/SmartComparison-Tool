/**
 * SmartCompare Chrome Extension — Side Panel UI
 *
 * Full comparison panel shown in Chrome's side panel.
 * Displays detailed product info, all listings, price history,
 * and deal comparison.
 */

import type {
  DetectedProduct,
  IdentifyResponse,
  CompareResponse,
  PriceHistoryResponse,
  AnalyticsData,
  AIRecommendation,
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
  const root = $("panel-root");
  if (!root) return;

  root.innerHTML = "";
  root.appendChild(renderHeader());

  const statusEl = el("div", { class: "status" }, "Detecting product…");
  root.appendChild(statusEl);

  // 1. Get detected product
  const productResp = await sendMessage<DetectedProduct | null>({
    type: "GET_DETECTED_PRODUCT",
  });

  if (!productResp.success || !productResp.data) {
    statusEl.remove();
    root.appendChild(renderEmptyState());
    return;
  }

  const product = productResp.data;
  statusEl.remove();
  root.appendChild(renderProductHero(product));

  // 2. Identify product
  const identifySection = el("div", { id: "identify-section" });
  identifySection.appendChild(renderLoading("Identifying product…"));
  root.appendChild(identifySection);

  const identifyResp = await sendMessage<IdentifyResponse>({
    type: "IDENTIFY_PRODUCT",
    payload: product,
  });

  identifySection.innerHTML = "";

  if (!identifyResp.success) {
    identifySection.innerHTML = `<p class="error">${escapeHtml(identifyResp.error)}</p>`;
    return;
  }

  if (identifyResp.data) {
    const identifyData = identifyResp.data;
    identifySection.appendChild(renderListings(identifyData));

      // Render inline price stats from identify response
      if (identifyData.priceStats) {
        identifySection.appendChild(renderPriceStats({
          currentListing: null,
          competitors: [],
          priceStats: identifyData.priceStats,
        }));
      }

      // Render analytics section
      if (identifyData.analytics) {
        identifySection.appendChild(renderAnalytics(identifyData.analytics));
      }

      // Render AI recommendation
      if (identifyData.recommendation) {
        identifySection.appendChild(renderRecommendation(identifyData.recommendation));
      }

      // Render metadata
      if (identifyData.metadata) {
        identifySection.appendChild(renderMetadata(identifyData.metadata));
      }

    // 3. Get comparison (only if no inline priceStats)
    if (!identifyData.priceStats) {
      const compareSection = el("div", { id: "compare-section" });
      compareSection.appendChild(renderLoading("Comparing prices…"));
      root.appendChild(compareSection);

      const compareResp = await sendMessage<CompareResponse>({
        type: "COMPARE_PRODUCT",
        payload: {
          productId: identifyData.productId,
          currentPlatform: product.platform,
        },
      });

      compareSection.innerHTML = "";
      if (compareResp.success && compareResp.data) {
        compareSection.appendChild(renderPriceStats(compareResp.data));
      } else {
        compareSection.innerHTML = `<p class="error">${escapeHtml(compareResp.success ? "Unknown error" : compareResp.error)}</p>`;
      }
    }

    // 4. Get price history
    const historySection = el("div", { id: "history-section" });
    historySection.appendChild(renderLoading("Loading price history…"));
    root.appendChild(historySection);

    const historyResp = await sendMessage<PriceHistoryResponse>({
      type: "GET_PRICE_HISTORY",
      payload: { productId: identifyData.productId },
    });

    historySection.innerHTML = "";
    if (historyResp.success && historyResp.data) {
      historySection.appendChild(renderPriceHistory(historyResp.data));
    } else {
      historySection.innerHTML = `<p class="error">${escapeHtml(historyResp.success ? "Unknown error" : historyResp.error)}</p>`;
    }
  } else {
    identifySection.innerHTML = `<p class="muted">No data returned from backend.</p>`;
  }
}

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

function renderHeader(): HTMLElement {
  const header = el("div", { class: "panel-header" });
  header.innerHTML = `
    <div class="logo">🔍 <strong>SmartCompare</strong> Pro</div>
    <div class="subtitle">Full Product Comparison</div>
  `;
  return header;
}

function renderEmptyState(): HTMLElement {
  const div = el("div", { class: "empty-state" });
  div.innerHTML = `
    <p class="empty-icon">🛒</p>
    <p><strong>No product detected</strong></p>
    <p class="muted">Navigate to a product page on a supported e-commerce site to see comparisons here.</p>
  `;
  return div;
}

function renderProductHero(product: DetectedProduct): HTMLElement {
  const section = el("div", { class: "product-hero" });
  const priceStr = product.price
    ? `${product.currency} ${product.price.toFixed(2)}`
    : "Price not available";

  section.innerHTML = `
    <div class="hero-content">
      ${product.image ? `<img class="hero-img" src="${escapeAttr(product.image)}" alt="" />` : ""}
      <div class="hero-info">
        <h2 class="hero-title">${escapeHtml(product.title)}</h2>
        <div class="hero-price">${escapeHtml(priceStr)}</div>
        <div class="hero-meta">
          <span class="badge">${escapeHtml(product.platform)}</span>
          ${product.brand ? `<span class="badge badge-outline">${escapeHtml(product.brand)}</span>` : ""}
        </div>
      </div>
    </div>
  `;
  return section;
}

function renderListings(data: IdentifyResponse): HTMLElement {
  const section = el("div", { class: "listings-section" });

  if (!data.listings.length) {
    section.innerHTML = `
      <h3 class="section-title">🏪 Stores Compared</h3>
      <div class="searching-fallback">
        <span class="spinner"></span>
        <p>Searching other marketplaces…</p>
        <p class="muted">This product hasn't been compared before. We're scanning stores for the first time.</p>
      </div>
    `;
    // Auto-retry after 5 seconds
    scheduleRetry(data);
    return section;
  }

  if (data.listings.length === 1) {
    // Only current store — show fallback and auto-retry
    section.innerHTML = `
      <h3 class="section-title">🏪 1 Store Found</h3>
      <div class="searching-fallback">
        <span class="spinner"></span>
        <p>Searching other marketplaces for better deals…</p>
      </div>
    `;
    scheduleRetry(data);
  }

  const sorted = [...data.listings].sort((a, b) => a.price - b.price);

  let html = `<h3 class="section-title">🏪 ${data.listings.length} Store(s) Compared</h3>`;
  html += `<div class="listings-grid">`;

  for (const listing of sorted) {
    const isLowest = listing === sorted[0];
    const discount = listing.originalPrice && listing.originalPrice > listing.price
      ? Math.round((1 - listing.price / listing.originalPrice) * 100)
      : null;

    html += `
      <div class="listing-card ${isLowest ? "listing-best" : ""}">
        <div class="listing-header">
          <span class="listing-platform badge">${escapeHtml(listing.storeDisplayName || listing.store || "Unknown")}</span>
          ${isLowest ? '<span class="badge badge-success">Best Price</span>' : ""}
          ${discount ? `<span class="badge badge-discount">${discount}% off</span>` : ""}
        </div>
        <div class="listing-price-row">
          <span class="listing-price">${escapeHtml(listing.currency)} ${listing.price.toFixed(2)}</span>
          ${listing.originalPrice ? `<span class="listing-original-price">${escapeHtml(listing.currency)} ${listing.originalPrice.toFixed(2)}</span>` : ""}
        </div>
        <div class="listing-seller muted">${escapeHtml(listing.seller)}</div>
        <div class="listing-details">
          <span class="listing-trust" title="Seller Trust Score">
            🛡️ ${listing.sellerTrustScore.toFixed(1)}/5
          </span>
          ${listing.rating ? `<span class="listing-rating" title="Product Rating">⭐ ${listing.rating.toFixed(1)}${listing.reviewCount ? ` (${listing.reviewCount.toLocaleString()})` : ""}</span>` : ""}
        </div>
        ${listing.deliveryInfo ? `<div class="listing-delivery muted">🚚 ${escapeHtml(listing.deliveryInfo)}</div>` : ""}
        ${listing.returnPolicy ? `<div class="listing-return muted">↩️ ${escapeHtml(listing.returnPolicy)}</div>` : ""}
        <div class="listing-stock ${listing.inStock ? "in-stock" : "out-stock"}">
          ${listing.inStock ? "✅ In Stock" : "❌ Out of Stock"}
        </div>
        <a class="listing-link" href="${escapeAttr(listing.url)}" target="_blank" rel="noopener noreferrer">
          View Deal ➜
        </a>
      </div>
    `;
  }

  html += `</div>`;

  // Render search links for stores without direct listings
  if (data.searchLinks && data.searchLinks.length > 0) {
    html += `<div class="search-links-section">`;
    html += `<h4 class="search-links-title">🔍 Also check on</h4>`;
    html += `<div class="search-links-grid">`;
    for (const link of data.searchLinks) {
      html += `<a class="search-link-btn" href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.displayName)} ➜</a>`;
    }
    html += `</div></div>`;
  }

  section.innerHTML = html;
  return section;
}

function renderPriceStats(data: CompareResponse): HTMLElement {
  const section = el("div", { class: "price-stats-section" });
  const { priceStats } = data;

  const lowestStore = priceStats.lowestStore || priceStats.lowestPlatform || "";

  section.innerHTML = `
    <h3 class="section-title">📊 Price Analysis</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Lowest</div>
        <div class="stat-value stat-low">${priceStats.lowest.toFixed(2)}</div>
        <div class="stat-platform muted">${escapeHtml(lowestStore)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Highest</div>
        <div class="stat-value stat-high">${priceStats.highest.toFixed(2)}</div>
        ${priceStats.highestStore ? `<div class="stat-platform muted">${escapeHtml(priceStats.highestStore)}</div>` : ""}
      </div>
      <div class="stat-card">
        <div class="stat-label">Average</div>
        <div class="stat-value">${priceStats.average.toFixed(2)}</div>
      </div>
    </div>
    ${priceStats.savingsPercent ? `
      <div class="savings-banner">
        💰 Save up to <strong>${priceStats.savingsPercent.toFixed(0)}%</strong> (₹${priceStats.savingsFromHighest.toFixed(0)}) by choosing the best store
      </div>
    ` : ""}
    ${data.competitors.length > 0 ? `<p class="muted">${data.competitors.length} competitor listing(s)</p>` : ""}
  `;
  return section;
}

function renderPriceHistory(data: PriceHistoryResponse): HTMLElement {
  const section = el("div", { class: "history-section" });

  if (!data.history.length) {
    section.innerHTML = `
      <h3 class="section-title">📈 Price History</h3>
      <p class="muted">No price history available yet.</p>
    `;
    return section;
  }

  const { stats } = data;
  const trendIcon =
    stats.trend === "down" ? "📉" : stats.trend === "up" ? "📈" : "➡️";

  section.innerHTML = `
    <h3 class="section-title">📈 Price History</h3>
    <div class="history-stats">
      <div class="history-stat">
        <span class="muted">All-Time Low</span>
        <strong>${stats.allTimeLow.toFixed(2)}</strong>
      </div>
      <div class="history-stat">
        <span class="muted">All-Time High</span>
        <strong>${stats.allTimeHigh.toFixed(2)}</strong>
      </div>
      <div class="history-stat">
        <span class="muted">30d Avg</span>
        <strong>${stats.avg30d.toFixed(2)}</strong>
      </div>
      <div class="history-stat">
        <span class="muted">Trend</span>
        <strong>${trendIcon} ${stats.trend}</strong>
      </div>
    </div>
    <div class="history-chart">
      ${renderSimpleChart(data.history)}
    </div>
  `;
  return section;
}

function renderSimpleChart(
  points: { timestamp: number; price: number }[],
): string {
  if (points.length < 2) return "<p class='muted'>Not enough data for chart.</p>";

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const width = 400;
  const height = 120;
  const padding = 10;

  const pathPoints = points
    .map((p, i) => {
      const x = padding + (i / (points.length - 1)) * (width - padding * 2);
      const y =
        height - padding - ((p.price - min) / range) * (height - padding * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return `
    <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
      <path d="${pathPoints}" fill="none" stroke="#6366f1" stroke-width="2" />
    </svg>
  `;
}

function renderAnalytics(analytics: AnalyticsData): HTMLElement {
  const section = el("div", { class: "analytics-section" });
  const trendIcon =
    analytics.trend === "down" ? "📉" : analytics.trend === "up" ? "📈" : "➡️";
  const trendClass =
    analytics.trend === "down" ? "trend-down" : analytics.trend === "up" ? "trend-up" : "trend-stable";

  let html = `<h3 class="section-title">📊 Price Intelligence</h3>`;
  html += `<div class="analytics-grid">`;
  html += `
    <div class="analytics-card">
      <span class="analytics-label">Trend</span>
      <span class="analytics-value ${trendClass}">${trendIcon} ${analytics.trend} (${(analytics.trendStrength * 100).toFixed(0)}%)</span>
    </div>
    <div class="analytics-card">
      <span class="analytics-label">Volatility</span>
      <span class="analytics-value">${analytics.volatility.toFixed(1)}%</span>
    </div>
    <div class="analytics-card">
      <span class="analytics-label">Price Δ (30d)</span>
      <span class="analytics-value ${analytics.priceChangePct < 0 ? "stat-low" : analytics.priceChangePct > 0 ? "stat-high" : ""}">${analytics.priceChangePct > 0 ? "+" : ""}${analytics.priceChangePct.toFixed(1)}%</span>
    </div>
  `;
  if (analytics.recentDrop) {
    html += `
      <div class="analytics-card analytics-highlight">
        <span class="analytics-label">Recent Drop</span>
        <span class="analytics-value stat-low">🔥 Yes</span>
      </div>
    `;
  }
  html += `</div>`;

  // Store rankings
  if (analytics.storeRankings?.length) {
    html += `<div class="store-rankings">`;
    html += `<h4 class="subsection-title">Store Rankings</h4>`;
    for (const store of analytics.storeRankings) {
      html += `
        <div class="ranking-row">
          <span class="ranking-store">${escapeHtml(store.store)}</span>
          <span class="ranking-price">₹${store.price.toLocaleString()}</span>
          <span class="ranking-trust" title="Store Trust Score">🛡️ ${store.trustScore}</span>
        </div>
      `;
    }
    html += `</div>`;
  }

  section.innerHTML = html;
  return section;
}

function renderRecommendation(rec: AIRecommendation): HTMLElement {
  const section = el("div", { class: "recommendation-section" });

  const recClass =
    rec.action === "BUY" ? "rec-buy" :
    rec.action === "WAIT" ? "rec-wait" : "rec-neutral";
  const recIcon =
    rec.action === "BUY" ? "✅" :
    rec.action === "WAIT" ? "⏳" : "🤔";
  const qualityClass = `quality-${rec.dealQuality}`;

  let html = `<h3 class="section-title">🤖 AI Recommendation</h3>`;
  html += `
    <div class="rec-banner ${recClass}">
      <div class="rec-header-row">
        <span class="rec-action">${recIcon} ${rec.action}</span>
        <span class="rec-confidence">${(rec.confidence).toFixed(0)}% confident</span>
      </div>
      <div class="rec-summary">${escapeHtml(rec.summary)}</div>
      <div class="rec-quality ${qualityClass}">Deal Quality: <strong>${rec.dealQuality.toUpperCase()}</strong></div>
    </div>
  `;

  if (rec.insights?.length) {
    html += `<div class="rec-insights">`;
    for (const insight of rec.insights) {
      if (typeof insight === 'string') {
        html += `<div class="rec-insight">💡 ${escapeHtml(insight)}</div>`;
      } else {
        html += `<div class="rec-insight">💡 <strong>${escapeHtml(insight.title)}:</strong> ${escapeHtml(insight.description)}</div>`;
      }
    }
    html += `</div>`;
  }

  if (rec.expectedDropPercent !== null && rec.expectedDropPercent !== undefined) {
    html += `<div class="rec-drop muted">Expected price drop: ~${rec.expectedDropPercent.toFixed(0)}%</div>`;
  }

  section.innerHTML = html;
  return section;
}

function renderMetadata(meta: { storesCovered: string[]; scrapedAt: string; cacheHit: boolean } | { totalStoresSearched: number; storesWithResults: number; cachedResults: number; freshResults: number; lastUpdated: string }): HTMLElement {
  const section = el("div", { class: "metadata-section" });

  if ("storesCovered" in meta) {
    const time = new Date(meta.scrapedAt).toLocaleTimeString();
    section.innerHTML = `
      <div class="metadata-row muted">
        <span>Stores: ${meta.storesCovered.join(", ")}</span>
        <span>${meta.cacheHit ? "⚡ Cached" : "🔄 Fresh"} · ${time}</span>
      </div>
    `;
  } else {
    const time = new Date(meta.lastUpdated).toLocaleTimeString();
    section.innerHTML = `
      <div class="metadata-row muted">
        <span>${meta.storesWithResults} of ${meta.totalStoresSearched} stores responded</span>
        <span>${meta.cachedResults > 0 ? "⚡ Cached" : "🔄 Fresh"} · ${time}</span>
      </div>
    `;
  }
  return section;
}

/* ------------------------------------------------------------------ */
/* Auto-retry logic for sparse results                                */
/* ------------------------------------------------------------------ */

let retryCount = 0;
const MAX_RETRIES = 2;

function scheduleRetry(data: IdentifyResponse): void {
  if (retryCount >= MAX_RETRIES) return;
  retryCount++;

  setTimeout(async () => {
    // Re-fetch product info to get updated listings
    const productResp = await sendMessage<DetectedProduct | null>({
      type: "GET_DETECTED_PRODUCT",
    });
    if (productResp.success && productResp.data) {
      // Re-identify to trigger a fresh aggregation
      const identifyResp = await sendMessage<IdentifyResponse>({
        type: "IDENTIFY_PRODUCT",
        payload: productResp.data,
      });
      if (identifyResp.success && identifyResp.data && identifyResp.data.listings.length > (data.listings?.length || 0)) {
        // Re-render the entire panel with new data
        init();
      }
    }
  }, 5000 * retryCount);
}

function renderLoading(text: string): HTMLElement {
  const div = el("div", { class: "loading" });
  div.innerHTML = `<span class="spinner"></span> ${escapeHtml(text)}`;
  return div;
}

/* ------------------------------------------------------------------ */
/* Messaging                                                           */
/* ------------------------------------------------------------------ */

let didAutoReloadForInvalidation = false;

function sendMessage<T>(message: unknown): Promise<ExtensionResponse<T>> {
  return new Promise((resolve) => {
    // If this script is accidentally executed in a normal page context,
    // window.chrome may exist but chrome.runtime will not.
    if (!globalThis.chrome?.runtime?.sendMessage) {
      resolve({
        success: false,
        error:
          "Extension runtime unavailable (chrome.runtime.sendMessage missing). Open this UI from the extension, not as a normal web page.",
      });
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response: ExtensionResponse<T>) => {
        const lastErr = chrome.runtime?.lastError;
        if (lastErr) {
          const msg = lastErr.message || String(lastErr);
          // Common during development when the extension reloads.
          if (msg.toLowerCase().includes("extension context invalidated")) {
            if (!didAutoReloadForInvalidation) {
              didAutoReloadForInvalidation = true;
              // Give Chrome a moment to re-initialize the extension context.
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
                "Extension reloaded. Please close and reopen the side panel.",
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

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ------------------------------------------------------------------ */
/* Storage change listener — re-render when product changes            */
/* ------------------------------------------------------------------ */

chrome.storage.onChanged.addListener((changes) => {
  if (changes.detectedProduct) {
    init();
  }
});

/* ------------------------------------------------------------------ */
/* Bootstrap                                                           */
/* ------------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", init);
