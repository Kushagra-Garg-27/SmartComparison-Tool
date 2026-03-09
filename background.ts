import type {
  Type as TypeAlias,
  Schema as SchemaAlias,
  GenerateContentResponse as GCR,
} from "@google/genai";
import { Product, Review, AnalysisResult, ChatMessage } from "./types";
import type { DetectedProduct } from "./detectors/types";

declare var chrome: any;

// --- Lazy Gemini initialization ---
// NEVER instantiate GoogleGenAI at top-level. The SDK import and constructor
// can crash the service worker if the key is missing or if the module performs
// browser-incompatible setup during evaluation.

// Ordered model fallback chain — if the primary model is overloaded (503/429),
// subsequent retries rotate through these alternatives.
const MODEL_CHAIN = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
] as const;
const PRIMARY_MODEL = MODEL_CHAIN[0];

const BACKEND_URL = "http://localhost:3001";

// --- Retry with exponential backoff + jitter ---

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 15000;

/** HTTP status codes that warrant a retry (transient server errors). */
function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code =
    (err as any).code ?? (err as any).httpStatusCode ?? (err as any).status;
  if (code === 429 || code === 503 || code === 500) return true;
  const msg = String((err as any).message ?? "").toLowerCase();
  return (
    msg.includes("unavailable") ||
    msg.includes("overloaded") ||
    msg.includes("high demand") ||
    msg.includes("resource exhausted") ||
    msg.includes("rate limit")
  );
}

/** Sleep for `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Execute `fn` with exponential backoff retries and model rotation.
 * On each retry the model index advances through MODEL_CHAIN so transient
 * per-model capacity limits can be side-stepped.
 */
async function withRetry<T>(
  fn: (model: string) => Promise<T>,
  label: string,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const model = MODEL_CHAIN[attempt % MODEL_CHAIN.length];
    try {
      return await fn(model);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        const delay = Math.min(
          BASE_DELAY_MS * 2 ** attempt + Math.random() * 500,
          MAX_DELAY_MS,
        );
        console.warn(
          `[SmartCompare] ${label} attempt ${attempt + 1} failed (model=${model}), ` +
            `retrying in ${Math.round(delay)}ms…`,
          (err as any)?.message ?? err,
        );
        await sleep(delay);
      } else {
        break;
      }
    }
  }
  throw lastError;
}
const STORAGE_ACTIVE_PRODUCT_KEY = "activeProduct";
const STORAGE_ACTIVE_PRODUCT_META_KEY = "activeProductMeta";

// The API key is injected by Vite's define plugin at build time.
// `process.env.API_KEY` is statically replaced — no runtime check needed.
const apiKey: string = process.env.API_KEY || "";

console.log("Gemini API key detected:", apiKey ? "YES" : "NO");
console.log("Key length:", apiKey?.length);

// Cached SDK instances — created on first use
let _ai: import("@google/genai").GoogleGenAI | null = null;
let _sdkModule: typeof import("@google/genai") | null = null;

/** Dynamically import the SDK and cache it. */
async function getSDK(): Promise<typeof import("@google/genai")> {
  if (!_sdkModule) {
    _sdkModule = await import("@google/genai");
  }
  return _sdkModule;
}

/** Return a ready-to-use GoogleGenAI instance, or null if no key. */
async function getAI(): Promise<import("@google/genai").GoogleGenAI | null> {
  if (!apiKey) {
    console.warn("[SmartCompare] No Gemini API key — AI features disabled.");
    return null;
  }
  if (!_ai) {
    const sdk = await getSDK();
    _ai = new sdk.GoogleGenAI({ apiKey });
  }
  return _ai;
}

/** Re-export Type enum after lazy load. */
async function getSchemaTypes() {
  const sdk = await getSDK();
  return { Type: sdk.Type };
}

// --- Message Handlers ---

chrome.runtime.onMessage.addListener(
  (message: any, sender: any, sendResponse: (response: any) => void) => {
    if (message.action === "PRODUCT_DETECTED") {
      handleProductDetected(message.payload, sender, message.meta).then(
        sendResponse,
      );
      return true;
    }

    if (message.action === "OPEN_SIDE_PANEL") {
      const tabId = sender?.tab?.id;
      if (typeof tabId === "number") {
        chrome.sidePanel
          ?.setOptions({ tabId, path: "panel.html", enabled: true })
          .then(() => chrome.sidePanel?.open({ tabId }))
          .catch((err: unknown) =>
            console.warn("[SmartCompare] Could not open side panel:", err),
          );
      }
      sendResponse({ status: "ok" });
      return false;
    }

    if (message.action === "BROADCAST_DEAL_SCORE") {
      const { tabId: targetTab, score } = message;
      if (typeof targetTab === "number" && typeof score === "number") {
        chrome.tabs
          .sendMessage(targetTab, { action: "UPDATE_DEAL_BADGE", score })
          .catch(() => {
            // Tab may not have content script — ignore
          });
      }
      sendResponse({ status: "ok" });
      return false;
    }

    if (message.action === "CHECK_AUTH_STATUS") {
      sendResponse({ hasKey: !!apiKey });
      return false; // Synchronous response
    }

    if (message.action === "FIND_LIVE_DEALS") {
      handleFindLiveDeals(message.productTitle).then(sendResponse);
      return true; // Indicates async response
    }

    if (message.action === "ANALYZE_COMPARISON") {
      handleAnalyzeComparison(
        message.currentProduct,
        message.competitors,
        message.reviews,
      ).then(sendResponse);
      return true; // Indicates async response
    }

    if (message.action === "AI_ANALYSIS_REQUEST") {
      handleAnalyzeComparison(
        message.payload?.currentProduct,
        message.payload?.competitors || [],
        message.payload?.reviews || [],
      ).then(sendResponse);
      return true;
    }

    if (message.action === "GET_ACTIVE_PRODUCT") {
      chrome.storage.local
        .get([STORAGE_ACTIVE_PRODUCT_KEY, STORAGE_ACTIVE_PRODUCT_META_KEY])
        .then((data: any) => {
          sendResponse({
            product: data[STORAGE_ACTIVE_PRODUCT_KEY] || null,
            meta: data[STORAGE_ACTIVE_PRODUCT_META_KEY] || null,
          });
        })
        .catch((error: unknown) => {
          console.warn("[SmartCompare] Failed to read active product:", error);
          sendResponse({ product: null, meta: null });
        });
      return true;
    }

    // --- Backend API Proxy Handlers ---
    // Content scripts cannot call the backend directly (CORS / security).
    // These handlers proxy requests from content scripts through the background worker.

    if (message.action === "BACKEND_IDENTIFY_PRODUCT") {
      handleBackendProxy("POST", "/api/product/identify", message.payload).then(
        sendResponse,
      );
      return true;
    }

    if (message.action === "BACKEND_COMPARE_PRODUCT") {
      handleBackendProxy("POST", "/api/product/compare", message.payload).then(
        sendResponse,
      );
      return true;
    }

    if (message.action === "FETCH_COMPARISON") {
      handleBackendProxy("POST", "/api/product/compare", message.payload).then(
        sendResponse,
      );
      return true;
    }

    if (message.action === "BACKEND_PRICE_HISTORY") {
      const params = new URLSearchParams({
        productId: message.payload.productId,
      });
      if (message.payload.platform)
        params.set("platform", message.payload.platform);
      handleBackendProxy("GET", `/api/product/history?${params}`).then(
        sendResponse,
      );
      return true;
    }

    if (message.action === "BACKEND_HEALTH") {
      handleBackendProxy("GET", "/health").then(sendResponse);
      return true;
    }
  },
);

chrome.runtime.onConnect.addListener((port: any) => {
  if (port.name === "gemini-chat") {
    port.onMessage.addListener(
      async (msg: {
        history: any[];
        newMessage: string;
        contextData: string;
      }) => {
        try {
          await handleChatStream(
            port,
            msg.history,
            msg.newMessage,
            msg.contextData,
          );
        } catch (e) {
          console.error("Chat Error", e);
          port.postMessage({ error: "Failed to generate response." });
        }
      },
    );
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel
    ?.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err: unknown) => {
      console.warn("[SmartCompare] Failed to set side panel behavior:", err);
    });
});

// Capture extension icon click and open the side panel for the current tab.
chrome.action.onClicked.addListener(async (tab: any) => {
  const tabId = tab?.id;
  if (typeof tabId !== "number") return;

  try {
    await chrome.sidePanel?.setOptions({
      tabId,
      path: "panel.html",
      enabled: true,
    });
    await chrome.sidePanel?.open({ tabId });
  } catch (err) {
    console.warn("[SmartCompare] Could not open side panel:", err);
  }
});

async function handleProductDetected(
  detectedProduct: DetectedProduct | null,
  sender: any,
  meta?: { reason?: string; url?: string; detectedAt?: number },
): Promise<{ status: "ok" | "error"; message?: string }> {
  if (!detectedProduct) {
    return { status: "error", message: "Missing detected product payload." };
  }

  const tabId = sender?.tab?.id;
  const activeProduct: DetectedProduct = {
    ...detectedProduct,
    url: detectedProduct.url || sender?.tab?.url || meta?.url || "",
  };

  try {
    await chrome.storage.local.set({
      [STORAGE_ACTIVE_PRODUCT_KEY]: activeProduct,
      [STORAGE_ACTIVE_PRODUCT_META_KEY]: {
        tabId: typeof tabId === "number" ? tabId : null,
        url: activeProduct.url,
        reason: meta?.reason || "content-script",
        detectedAt: meta?.detectedAt || Date.now(),
      },
    });

    if (typeof tabId === "number") {
      await chrome.sidePanel?.setOptions({
        tabId,
        path: "panel.html",
        enabled: true,
      });
      await chrome.sidePanel?.open({ tabId });
    }

    return { status: "ok" };
  } catch (error) {
    console.warn("[SmartCompare] Failed to process PRODUCT_DETECTED:", error);
    return { status: "error", message: "Failed to open side panel." };
  }
}

// --- Backend API Proxy ---

/**
 * Generic proxy for forwarding requests from content scripts to the backend API.
 * Returns parsed JSON on success, or { error, offline } on failure.
 */
async function handleBackendProxy(
  method: "GET" | "POST",
  path: string,
  body?: any,
): Promise<any> {
  try {
    const url = `${BACKEND_URL}${path}`;
    const init: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
    };
    if (body && method === "POST") {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);
    if (!response.ok) {
      console.warn(
        `[SmartCompare] Backend ${path} returned ${response.status}`,
      );
      return { error: `Backend returned ${response.status}`, offline: false };
    }
    return await response.json();
  } catch (err: any) {
    console.info("[SmartCompare] Backend unavailable:", err?.message);
    return { error: "Backend unavailable", offline: true };
  }
}

// --- API Logic Implementation ---

async function handleFindLiveDeals(
  productTitle: string,
): Promise<Partial<Product>[]> {
  const ai = await getAI();
  if (!ai) return []; // No API key — skip gracefully

  const { Type } = await getSchemaTypes();

  const prompt = `
    Find valid, active product detail pages for buying "${productTitle}" online.
    Search on major trusted retailers like Amazon, eBay, Best Buy, Walmart, B&H, and Target.
    
    Return a JSON array of found buying options. For each, provide:
    - vendor: The name of the store (e.g. "Best Buy").
    - price: The current price number (estimate if necessary).
    - url: The direct link to the product page.
    - condition: "New", "Used", or "Refurbished".
    
    Only include results where the product is actually available.
    Ignore generic search result pages; look for specific item pages.
  `;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        vendor: { type: Type.STRING },
        price: { type: Type.NUMBER },
        url: { type: Type.STRING },
        condition: { type: Type.STRING },
      },
    },
  };

  try {
    const deals = await withRetry(async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });
      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    }, "FindLiveDeals");

    return deals.map((d: any) => ({
      vendor: d.vendor,
      price: d.price,
      url: d.url,
      condition: d.condition,
      verificationStatus: "verified",
    }));
  } catch (error) {
    console.error(
      "Gemini Live Deal Discovery Error (all retries exhausted):",
      error,
    );
    return [];
  }
}

async function handleAnalyzeComparison(
  currentProduct: Product,
  competitors: Product[],
  reviews: Review[],
): Promise<AnalysisResult> {
  const ai = await getAI();
  if (!ai) {
    return {
      bestPriceId:
        competitors.length > 0 ? competitors[0].id : currentProduct.id,
      bestValueId: currentProduct.id,
      trustWarningId: null,
      summary: "AI analysis unavailable — no API key configured.",
      recommendation: "Configure your Gemini API key to enable analysis.",
      pros: [],
      cons: [],
      alternatives: [],
    };
  }

  const { Type } = await getSchemaTypes();

  const prompt = `
    You are an expert e-commerce shopping assistant.
    Analyze the current product being viewed vs its competitors.
    
    Current Product: ${JSON.stringify(currentProduct)}
    Competitors: ${JSON.stringify(competitors)}
    Recent Reviews: ${JSON.stringify(reviews.map((r) => r.text))}

    Task:
    1. Identify the 'bestPriceId' (lowest total cost).
    2. Identify the 'bestValueId' (balance of price, condition, trust).
    3. Identify any 'trustWarningId' if a seller has a low trust score (< 70).
    4. Write a concise 'summary' (max 2 sentences).
    5. Provide a direct 'recommendation'.
    6. List 3 'pros' and 3 'cons'.
    7. Suggest 2 'alternatives' (different models/brands) with title, price, reason.

    Return JSON.
  `;

  const schema = {
    type: Type.OBJECT,
    properties: {
      bestPriceId: { type: Type.STRING },
      bestValueId: { type: Type.STRING },
      trustWarningId: { type: Type.STRING, nullable: true },
      summary: { type: Type.STRING },
      recommendation: { type: Type.STRING },
      pros: { type: Type.ARRAY, items: { type: Type.STRING } },
      cons: { type: Type.ARRAY, items: { type: Type.STRING } },
      alternatives: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            price: { type: Type.NUMBER },
            reason: { type: Type.STRING },
          },
        },
      },
    },
    required: [
      "bestPriceId",
      "bestValueId",
      "summary",
      "recommendation",
      "pros",
      "cons",
      "alternatives",
    ],
  };

  try {
    return await withRetry(async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });
      const text = response.text;
      if (!text) throw new Error("No response from Gemini");
      return JSON.parse(text) as AnalysisResult;
    }, "AnalyzeComparison");
  } catch (error) {
    console.error("Gemini Analysis Error (all retries exhausted):", error);
    return {
      bestPriceId:
        competitors.length > 0 ? competitors[0].id : currentProduct.id,
      bestValueId: currentProduct.id,
      trustWarningId: null,
      summary:
        "Comparison temporarily unavailable — the AI service is under heavy load.",
      recommendation: "Please try refreshing in a minute.",
      pros: [],
      cons: [],
      alternatives: [],
    };
  }
}

async function handleChatStream(
  port: any,
  history: any[],
  newMessage: string,
  contextData: string,
) {
  const ai = await getAI();
  if (!ai) {
    port.postMessage({ text: "AI chat unavailable — no API key configured." });
    port.postMessage({ done: true });
    return;
  }

  // Chat streaming with retry — recreate the chat session on each attempt
  // since a partially-consumed stream cannot be restarted.
  await withRetry(async (model) => {
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction: `You are SmartCompare, a helpful shopping assistant. 
        You have context about the product the user is viewing and its competitors: ${contextData}.
        Answer questions briefly (under 50 words) and objectively. Focus on value and safety.`,
      },
      history: history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    });

    const responseStream = await chat.sendMessageStream({
      message: newMessage,
    });

    for await (const chunk of responseStream) {
      const c = chunk as import("@google/genai").GenerateContentResponse;
      if (c.text) {
        port.postMessage({ text: c.text });
      }
    }
    port.postMessage({ done: true });
  }, "ChatStream");
}
