import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, AnalysisResult, ChatMessage } from "../types";
import { Send, Bot, User, MessageCircle, Sparkles } from "lucide-react";
import { chatWithShopper } from "../services/geminiService";
import { GenerateContentResponse } from "@google/genai";

interface ChatAssistantProps {
  currentProduct: Product;
  competitors: Product[];
  analysis: AnalysisResult | null;
}

const suggestedQueries = [
  "Is this a good deal?",
  "Should I wait for a sale?",
  "Are there better alternatives?",
  "Which seller is safest?",
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
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

  const handleSend = async (message?: string) => {
    const text = message || input.trim();
    if (!text) return;

    const userMsg: ChatMessage = { role: "user", text };
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

  return (
    <motion.div
      className="glass-card overflow-hidden flex flex-col"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      {/* Header */}
      <div className="relative px-4 py-3 border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="relative flex items-center space-x-2.5">
          <motion.div
            className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <MessageCircle className="h-3.5 w-3.5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Ask SmartCompare
            </h3>
            <p className="text-[9px] text-white/30">AI shopping assistant</p>
          </div>
          {chatHistory.length > 0 && (
            <div className="ml-auto flex items-center space-x-1 text-[9px] text-white/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 max-h-[240px] min-h-[140px] overflow-y-auto custom-scrollbar px-4 py-3 space-y-3"
      >
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center py-4">
            <motion.div
              className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mb-3"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </motion.div>
            <p className="text-[11px] text-white/30 mb-3">
              Ask me anything about this product
            </p>
            <div className="w-full grid grid-cols-2 gap-1.5">
              {suggestedQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-left text-[10px] text-indigo-300/70 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/15 border border-indigo-500/10 hover:border-indigo-500/25 px-2.5 py-2 rounded-lg transition-all duration-200"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {chatHistory.map((msg, idx) => (
            <motion.div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {msg.role === "model" && (
                <div className="h-5 w-5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Bot className="h-3 w-3 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-500 text-white rounded-br-md"
                    : "bg-white/[0.07] text-white/80 border border-white/10 rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
              {msg.role === "user" && (
                <div className="h-5 w-5 rounded-md bg-white/10 flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                  <User className="h-3 w-3 text-white/50" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="h-5 w-5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Bot className="h-3 w-3 text-white" />
            </div>
            <div className="bg-white/[0.07] border border-white/10 rounded-2xl rounded-bl-md px-3 py-2.5 flex space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 typing-dot animate-typing-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 typing-dot animate-typing-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 typing-dot animate-typing-dot" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="px-3 py-2.5 border-t border-white/5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about this product..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-3.5 pr-10 text-[11px] text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="absolute right-1.5 p-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-white/10 disabled:text-white/20 text-white rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:shadow-none"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
