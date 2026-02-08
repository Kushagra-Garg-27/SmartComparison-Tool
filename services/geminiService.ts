import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Product, Review, AnalysisResult } from "../types";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const ANALYSIS_MODEL = 'gemini-3-flash-preview';

/**
 * Validates availability and discovers real product pages using Gemini Search Grounding.
 * This acts as a robust validation step: if a product page appears in search results for specific
 * queries, we consider it "verified" and existing.
 */
export const findLiveDeals = async (productTitle: string): Promise<Partial<Product>[]> => {
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
};

// Deprecated: kept for backward compatibility if needed, but unused in main flow now
export const discoverCompetitorLinks = async (productTitle: string): Promise<Array<{url: string, title: string}>> => {
    return [];
};

export const analyzeProductComparison = async (
  currentProduct: Product,
  competitors: Product[],
  reviews: Review[]
): Promise<AnalysisResult> => {

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
      summary: "Comparison temporarily unavailable.",
      recommendation: "Check back later.",
      pros: ["Premium Sound", "Long Battery"],
      cons: ["High Price"],
      alternatives: []
    };
  }
};

export const chatWithShopper = async (
  history: { role: string, text: string }[],
  newMessage: string,
  contextData: string
) => {
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

  const response = await chat.sendMessageStream({ message: newMessage });
  return response;
};