import { apiClient } from "./apiClient";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatContext {
  product: string;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  store: string;
  dealScore: number;
  sellerTrust: number;
  priceHistory: string;
  alternatives: { name: string; price: number; store: string }[];
}

export const chatService = {
  /**
   * Returns a streaming Response for the AI shopping advisor.
   * The caller is responsible for reading the SSE stream.
   */
  sendMessage: async (
    messages: ChatMessage[],
    context: ChatContext
  ): Promise<Response> => {
    return apiClient.stream("/ai/chat", { messages, context });
  },
};
