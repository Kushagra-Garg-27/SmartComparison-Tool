import { detectProduct } from "./detectors";
import type { DetectedProduct } from "./detectors/types";

declare var chrome: any;

const DETECTION_DEBOUNCE_MS = 700;
const URL_POLL_INTERVAL_MS = 1000;
const BADGE_ID = "smartcompare-deal-badge";

let lastFingerprint = "";
let lastSeenUrl = window.location.href;
let detectTimer: number | null = null;
let badgeInjected = false;

function toFingerprint(product: DetectedProduct): string {
  return [
    product.platform,
    product.externalId || "",
    product.title,
    String(product.price ?? ""),
    product.url,
  ].join("|");
}

function notifyBackground(product: DetectedProduct, reason: string): void {
  chrome.runtime.sendMessage(
    {
      action: "PRODUCT_DETECTED",
      payload: product,
      meta: {
        reason,
        url: window.location.href,
        detectedAt: Date.now(),
      },
    },
    () => {
      if (chrome.runtime?.lastError) {
        console.warn(
          "[SmartCompare] PRODUCT_DETECTED send failed:",
          chrome.runtime.lastError.message,
        );
      }
    },
  );
}

// ── On-Page Deal Indicator Badge ────────────────
function injectDealBadge(): void {
  if (badgeInjected || document.getElementById(BADGE_ID)) return;

  const badge = document.createElement("div");
  badge.id = BADGE_ID;
  badge.setAttribute("role", "button");
  badge.setAttribute("aria-label", "Open SmartCompare AI");
  badge.innerHTML = `
    <div style="
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(135deg, rgba(17,22,48,0.92), rgba(11,15,26,0.96));
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 14px;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.08);
      transition: all 0.25s ease;
      user-select: none;
      animation: sc-badge-entrance 0.4s cubic-bezier(0.4,0,0.2,1);
    " id="sc-badge-inner">
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="scBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6366F1"/>
            <stop offset="100%" stop-color="#38BDF8"/>
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#scBadgeGrad)" opacity="0.2"/>
        <path d="M16 6L18.5 13L25 13L19.75 17.5L21.5 25L16 20.5L10.5 25L12.25 17.5L7 13L13.5 13Z" fill="url(#scBadgeGrad)" opacity="0.9"/>
      </svg>
      <div style="display:flex;flex-direction:column;gap:1px;">
        <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:-0.2px;">SmartCompare</span>
        <span id="sc-badge-subtitle" style="font-size:9px;font-weight:500;color:rgba(99,102,241,0.7);">Click to analyze</span>
      </div>
      <div id="sc-badge-score" style="display:none;margin-left:4px;min-width:36px;height:36px;border-radius:10px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.15);display:none;align-items:center;justify-content:center;flex-direction:column;">
        <span id="sc-badge-score-val" style="font-size:14px;font-weight:800;color:#22C55E;line-height:1;"></span>
        <span style="font-size:7px;font-weight:600;color:rgba(255,255,255,0.25);letter-spacing:0.5px;">/100</span>
      </div>
    </div>
    <style>
      @keyframes sc-badge-entrance {
        from { opacity: 0; transform: translateY(12px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      #sc-badge-inner:hover {
        border-color: rgba(99,102,241,0.4) !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.15) !important;
        transform: translateY(-2px) !important;
      }
    </style>
  `;

  badge.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "OPEN_SIDE_PANEL" });
  });

  document.body.appendChild(badge);
  badgeInjected = true;
}

function updateBadgeScore(score: number): void {
  const scoreEl = document.getElementById("sc-badge-score");
  const scoreVal = document.getElementById("sc-badge-score-val");
  const subtitle = document.getElementById("sc-badge-subtitle");
  if (!scoreEl || !scoreVal) return;

  const color = score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";
  const label =
    score >= 80 ? "Great Deal" : score >= 60 ? "Fair Price" : "Overpriced";

  scoreVal.textContent = String(score);
  scoreVal.style.color = color;
  scoreEl.style.display = "flex";
  if (subtitle) {
    subtitle.textContent = label;
    subtitle.style.color = color;
  }
}

function removeBadge(): void {
  const existing = document.getElementById(BADGE_ID);
  if (existing) existing.remove();
  badgeInjected = false;
}

// Listen for score updates from background
chrome.runtime.onMessage.addListener(
  (message: any, _sender: any, sendResponse: (r: any) => void) => {
    if (
      message.action === "UPDATE_DEAL_BADGE" &&
      typeof message.score === "number"
    ) {
      injectDealBadge();
      updateBadgeScore(message.score);
      sendResponse({ status: "ok" });
    }
    return false;
  },
);

function runDetection(reason: string): void {
  const detectedProduct = detectProduct(document, window.location.href);
  if (!detectedProduct) {
    return;
  }

  const fingerprint = toFingerprint(detectedProduct);
  if (fingerprint === lastFingerprint) {
    return;
  }

  lastFingerprint = fingerprint;
  notifyBackground(detectedProduct, reason);
  injectDealBadge();
}

function scheduleDetection(reason: string): void {
  if (detectTimer !== null) {
    window.clearTimeout(detectTimer);
  }

  detectTimer = window.setTimeout(() => {
    runDetection(reason);
  }, DETECTION_DEBOUNCE_MS);
}

console.log("[SmartCompare] Content script loaded (detection-only mode).");

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => scheduleDetection("dom-ready"),
    { once: true },
  );
} else {
  scheduleDetection("initial");
}

const observer = new MutationObserver(() => {
  scheduleDetection("dom-mutation");
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

const urlPoll = window.setInterval(() => {
  if (window.location.href !== lastSeenUrl) {
    lastSeenUrl = window.location.href;
    removeBadge();
    scheduleDetection("url-change");
  }
}, URL_POLL_INTERVAL_MS);

window.addEventListener("beforeunload", () => {
  observer.disconnect();
  window.clearInterval(urlPoll);
  if (detectTimer !== null) {
    window.clearTimeout(detectTimer);
  }
});
