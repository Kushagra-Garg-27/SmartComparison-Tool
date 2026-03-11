/**
 * SmartCompare Chrome Extension — Background Service Worker
 *
 * Responsibilities:
 * - Listens for product detection messages from content scripts
 * - Proxies API calls to the backend (keeps API URL out of content scripts)
 * - Manages chrome.storage for detected product state
 * - Opens side panel on demand
 */

import { backendApi } from "./services/backendApi.js";
import type {
  DetectedProduct,
  ExtensionMessage,
  ExtensionResponse,
} from "./types.js";

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

let lastDetectedProduct: DetectedProduct | null = null;

/* ------------------------------------------------------------------ */
/* Message handler                                                     */
/* ------------------------------------------------------------------ */

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void,
  ) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((err) =>
        sendResponse({ success: false, error: String(err?.message || err) }),
      );
    // Return true to indicate async response
    return true;
  },
);

async function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
): Promise<ExtensionResponse> {
  switch (message.type) {
    /* --------------------------------------------------------------- */
    case "PRODUCT_DETECTED": {
      lastDetectedProduct = message.payload;
      // Persist in chrome.storage so panel/popup can read it
      await chrome.storage.local.set({
        detectedProduct: message.payload,
        detectedAt: Date.now(),
        detectedTabId: sender.tab?.id,
      });

      // Update badge to indicate product found
      if (sender.tab?.id) {
        await chrome.action.setBadgeText({
          text: "✓",
          tabId: sender.tab.id,
        });
        await chrome.action.setBadgeBackgroundColor({
          color: "#22c55e",
          tabId: sender.tab.id,
        });
      }
      return { success: true, data: null };
    }

    /* --------------------------------------------------------------- */
    case "GET_DETECTED_PRODUCT": {
      if (lastDetectedProduct) {
        return { success: true, data: lastDetectedProduct };
      }
      const stored = await chrome.storage.local.get("detectedProduct");
      return { success: true, data: stored.detectedProduct || null };
    }

    /* --------------------------------------------------------------- */
    case "IDENTIFY_PRODUCT": {
      const result = await backendApi.identify(message.payload);
      return { success: true, data: result };
    }

    /* --------------------------------------------------------------- */
    case "COMPARE_PRODUCT": {
      const { productId, currentPlatform } = message.payload;
      const result = await backendApi.compare(productId, currentPlatform);
      return { success: true, data: result };
    }

    /* --------------------------------------------------------------- */
    case "GET_PRICE_HISTORY": {
      const result = await backendApi.getHistory(message.payload.productId);
      return { success: true, data: result };
    }

    /* --------------------------------------------------------------- */
    case "OPEN_SIDE_PANEL": {
      // Opens the side panel for the sender's tab
      const tabId = sender.tab?.id;
      if (tabId) {
        await chrome.sidePanel.open({ tabId });
      }
      return { success: true, data: null };
    }

    /* --------------------------------------------------------------- */
    default:
      return { success: false, error: "Unknown message type" };
  }
}

/* ------------------------------------------------------------------ */
/* Extension icon click → open side panel                              */
/* ------------------------------------------------------------------ */

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

/* ------------------------------------------------------------------ */
/* Install / update handler                                            */
/* ------------------------------------------------------------------ */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    console.log("SmartCompare Pro installed");
  }
});
