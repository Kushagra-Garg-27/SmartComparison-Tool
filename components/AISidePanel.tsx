import React, { useState, useRef, useEffect } from "react";
import { Product, AnalysisResult, ChatMessage } from "../types";
import {
  Sparkles,
  Send,
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronRight,
  MessageCircle,
  Bot,
} from "lucide-react";
import { RecommendationCard, SellerTrustBlock } from "./RecommendationCard";
import { chatWithShopper } from "../services/geminiService";
import { GenerateContentResponse } from "@google/genai";

interface AISidePanelProps {
  currentProduct: Product;
  competitors: Product[];
  analysis: AnalysisResult | null;
}

export const AISidePanel: React.FC<AISidePanelProps> = ({
  currentProduct,
  competitors,
  analysis,
}) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const handleSendChat = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: "user", text: input };
    setChatHistory((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const context = `Current: ${currentProduct.title} ($${currentProduct.price}). Competitors: ${competitors.length} available. Analysis: ${analysis?.summary}`;
      const responseStream = await chatWithShopper(
        chatHistory,
        userMsg.text,
        context,
      );

      let fullResponse = "";
      setChatHistory((prev) => [...prev, { role: "model", text: "" }]);

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullResponse += c.text;
          setChatHistory((prev) => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1].text = fullResponse;
            return newHistory;
          });
        }
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "model",
          text: "Sorry, I'm having trouble connecting right now.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const allProducts = [currentProduct, ...competitors];

  // Price stats
  const allPrices = allProducts.filter((p) => p.price > 0).map((p) => p.price);
  const avgPrice =
    allPrices.length > 0
      ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length
      : 0;
  const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const bestPlatform =
    allProducts.find((p) => p.price === lowestPrice)?.platform || "—";

  return (
    <div className="flex flex-col h-full">
      {/* Section label */}
      <div className="flex items-center space-x-2 px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          AI Insights
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-3">
        {/* AI Summary */}
        {analysis && (
          <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-3.5 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <div className="h-6 w-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                AI Summary
              </h4>
            </div>

            <ul className="space-y-1.5 text-xs text-indigo-800 leading-relaxed">
              {lowestPrice > 0 && (
                <li className="flex items-start space-x-1.5">
                  <TrendingDown className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Best price:{" "}
                    <strong>
                      {bestPlatform} ${lowestPrice.toFixed(2)}
                    </strong>
                  </span>
                </li>
              )}
              {avgPrice > 0 && (
                <li className="flex items-start space-x-1.5">
                  <Minus className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>
                    Average market price:{" "}
                    <strong>${avgPrice.toFixed(2)}</strong>
                  </span>
                </li>
              )}
              {currentProduct.priceTrend && (
                <li className="flex items-start space-x-1.5">
                  {currentProduct.priceTrend === "down" ? (
                    <TrendingDown className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : currentProduct.priceTrend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Minus className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  )}
                  <span>
                    Price trend:{" "}
                    <strong className="capitalize">
                      {currentProduct.priceTrend}
                    </strong>{" "}
                    over recent period
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Smart Recommendation */}
        {analysis && (
          <RecommendationCard
            recommendation={analysis.recommendation}
            summary={analysis.summary}
          />
        )}

        {/* Pros & Cons */}
        {analysis && (analysis.pros.length > 0 || analysis.cons.length > 0) && (
          <div className="grid grid-cols-1 gap-2">
            {analysis.pros.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <h4 className="text-[10px] font-bold text-emerald-800 uppercase mb-1.5 tracking-wide">
                  Pros
                </h4>
                <ul className="space-y-1">
                  {analysis.pros.slice(0, 3).map((p, i) => (
                    <li
                      key={i}
                      className="flex items-start text-[11px] text-emerald-700"
                    >
                      <ChevronRight className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.cons.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
                <h4 className="text-[10px] font-bold text-red-800 uppercase mb-1.5 tracking-wide">
                  Cons
                </h4>
                <ul className="space-y-1">
                  {analysis.cons.slice(0, 3).map((c, i) => (
                    <li
                      key={i}
                      className="flex items-start text-[11px] text-red-700"
                    >
                      <ChevronRight className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Seller Trust */}
        <SellerTrustBlock products={allProducts} />

        {/* Chat Assistant */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center space-x-2 px-3 py-2.5 border-b border-gray-100 bg-gray-50/70">
            <div className="h-5 w-5 rounded-md bg-indigo-100 flex items-center justify-center">
              <MessageCircle className="h-3 w-3 text-indigo-600" />
            </div>
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
              Ask SmartCompare
            </span>
          </div>

          {/* Chat messages */}
          <div
            ref={scrollRef}
            className="max-h-[180px] overflow-y-auto px-3 py-2 space-y-2 custom-scrollbar"
          >
            {chatHistory.length === 0 && (
              <div className="py-3 text-center">
                <p className="text-[11px] text-gray-400 mb-2">Try asking:</p>
                <div className="space-y-1">
                  {[
                    "Is this a good price?",
                    "Should I wait for a sale?",
                    "Which seller is safest?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                      }}
                      className="block w-full text-left text-[11px] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-400 animate-pulse">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Ask about this product…"
                className="w-full border border-gray-200 rounded-lg py-1.5 pl-3 pr-8 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-gray-50"
              />
              <button
                onClick={handleSendChat}
                className="absolute right-1 top-1 p-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
