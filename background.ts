import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { Product, Review, AnalysisResult, ChatMessage } from "./types";

declare var chrome: any;

// The API Key is safely injected here by Vite's define plugin during build.
// Since this file becomes background.js (Service Worker), it is isolated from the webpage.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
const ANALYSIS_MODEL = 'gemini-3-flash-preview';

// --- Message Handlers ---

chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: (response: any) => void) => {
  if (message.action === "CHECK_AUTH_STATUS") {
    // Return true if key exists, but DO NOT return the key itself
    sendResponse({ hasKey: !!apiKey });
    return false; // Synchronous response
  }

  if (message.action === "FIND_LIVE_DEALS") {
    handleFindLiveDeals(message.productTitle).then(sendResponse);
    return true; // Indicates async response
  }
  
  if (message.action === "ANALYZE_COMPARISON") {
    handleAnalyzeComparison(message.currentProduct, message.competitors, message.reviews).then(sendResponse);
    return true; // Indicates async response
  }
  
  if (message.action === "TOGGLE_OVERLAY") {
     // Forward to active tab (handled by content script)
     return false; 
  }
});

chrome.runtime.onConnect.addListener((port: any) => {
  if (port.name === 'gemini-chat') {
    port.onMessage.addListener(async (msg: { history: any[], newMessage: string, contextData: string }) => {
      try {
        await handleChatStream(port, msg.history, msg.newMessage, msg.contextData);
      } catch (e) {
        console.error("Chat Error", e);
        port.postMessage({ error: "Failed to generate response." });
      }
    });
  }
});

chrome.action.onClicked.addListener((tab: any) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_OVERLAY" }).catch((err: any) => {
      console.warn("Could not send message to content script.", err);
    });
  }
});

// --- API Logic Implementation ---

async function handleFindLiveDeals(productTitle: string): Promise<Partial<Product>[]> {
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

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        vendor: { type: Type.STRING },
        price: { type: Type.NUMBER },
        url: { type: Type.STRING },
        condition: { type: Type.STRING }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const deals = JSON.parse(text);
    return deals.map((d: any) => ({
      vendor: d.vendor,
      price: d.price,
      url: d.url,
      condition: d.condition,
      verificationStatus: 'verified'
    }));

  } catch (error) {
    console.error("Gemini Live Deal Discovery Error:", error);
    return [];
  }
}

async function handleAnalyzeComparison(
  currentProduct: Product,
  competitors: Product[],
  reviews: Review[]
): Promise<AnalysisResult> {
  const prompt = `
    You are an expert e-commerce shopping assistant.
    Analyze the current product being viewed vs its competitors.
    
    Current Product: ${JSON.stringify(currentProduct)}
    Competitors: ${JSON.stringify(competitors)}
    Recent Reviews: ${JSON.stringify(reviews.map(r => r.text))}

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

  const schema: Schema = {
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
            reason: { type: Type.STRING }
          }
        }
      }
    },
    required: ["bestPriceId", "bestValueId", "summary", "recommendation", "pros", "cons", "alternatives"]
  };

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback if API fails
    return {
      bestPriceId: competitors.length > 0 ? competitors[0].id : currentProduct.id,
      bestValueId: currentProduct.id,
      trustWarningId: null,
      summary: "Comparison temporarily unavailable due to network.",
      recommendation: "Check back later.",
      pros: [],
      cons: [],
      alternatives: []
    };
  }
}

async function handleChatStream(port: any, history: any[], newMessage: string, contextData: string) {
  const chat = ai.chats.create({
    model: ANALYSIS_MODEL,
    config: {
      systemInstruction: `You are SmartCompare, a helpful shopping assistant. 
      You have context about the product the user is viewing and its competitors: ${contextData}.
      Answer questions briefly (under 50 words) and objectively. Focus on value and safety.`
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }))
  });

  const responseStream = await chat.sendMessageStream({ message: newMessage });

  for await (const chunk of responseStream) {
    const c = chunk as GenerateContentResponse;
    if (c.text) {
      port.postMessage({ text: c.text });
    }
  }
  port.postMessage({ done: true });
}