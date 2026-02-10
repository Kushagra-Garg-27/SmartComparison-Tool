import { Product, Review, AnalysisResult } from "../types";

declare var chrome: any;

// Helper to check if we are in an extension environment
const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage;

/**
 * Checks if the background script has a valid API key configured.
 * This prevents the content script from ever needing to know the key.
 */
export const checkAuthStatus = async (): Promise<boolean> => {
  if (!isExtension) {
     return false; // Not in extension, assume no secure key available
  }
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ action: "CHECK_AUTH_STATUS" }, (response: { hasKey: boolean }) => {
        // Handle case where extension might be reloading or disconnected
        if (chrome.runtime.lastError) {
          resolve(false);
          return;
        }
        resolve(response?.hasKey || false);
      });
    } catch (e) {
      resolve(false);
    }
  });
};

/**
 * Validates availability and discovers real product pages using Gemini Search Grounding.
 * Delegates to Background Script to protect API Key.
 */
export const findLiveDeals = async (productTitle: string): Promise<Partial<Product>[]> => {
  if (!isExtension) {
    console.warn("SmartCompare: Running in Demo/Web mode (No background script). Mocking response.");
    return [];
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "FIND_LIVE_DEALS", productTitle },
      (response: Partial<Product>[]) => {
        resolve(response || []);
      }
    );
  });
};

export const discoverCompetitorLinks = async (productTitle: string): Promise<Array<{url: string, title: string}>> => {
    return [];
};

export const analyzeProductComparison = async (
  currentProduct: Product,
  competitors: Product[],
  reviews: Review[]
): Promise<AnalysisResult> => {
  if (!isExtension) {
    return {
      bestPriceId: currentProduct.id,
      bestValueId: currentProduct.id,
      trustWarningId: null,
      summary: "Demo Mode: Backend unavailable.",
      recommendation: "N/A",
      pros: ["Demo Feature"],
      cons: ["No API Access"],
      alternatives: []
    };
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "ANALYZE_COMPARISON", currentProduct, competitors, reviews },
      (response: AnalysisResult) => {
        resolve(response);
      }
    );
  });
};

export const chatWithShopper = async (
  history: { role: string, text: string }[],
  newMessage: string,
  contextData: string
): Promise<AsyncIterable<{ text: string }>> => {
  if (!isExtension) {
     // Mock generator for web demo
     return {
       async *[Symbol.asyncIterator]() {
         yield { text: "Demo Mode: Chat is only available in the extension." };
       }
     };
  }

  const port = chrome.runtime.connect({ name: 'gemini-chat' });
  port.postMessage({ history, newMessage, contextData });

  let resolveNext: ((value: any) => void) | null = null;
  const queue: any[] = [];
  let isDone = false;

  port.onMessage.addListener((msg: any) => {
    if (msg.done || msg.error) {
        isDone = true;
        if (msg.error) queue.push({ text: msg.error }); 
        // Signal final push if waiting
        if (resolveNext) {
            const r = resolveNext;
            resolveNext = null;
            r(null); 
        }
    } else if (msg.text) {
        if (resolveNext) {
            const r = resolveNext;
            resolveNext = null;
            r(msg);
        } else {
            queue.push(msg);
        }
    }
  });

  return {
    async *[Symbol.asyncIterator]() {
      try {
        while (true) {
          if (queue.length > 0) {
             const msg = queue.shift();
             yield { text: msg.text };
          } else if (isDone) {
             break;
          } else {
             // Wait for next message
             await new Promise(r => resolveNext = r);
          }
        }
      } finally {
        port.disconnect();
      }
    }
  };
};