import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, AnalysisResult, ChatMessage } from "../types";
import {
  Send,
  Bot,
  User,
  Sparkles,
  ArrowUp,
  ShieldCheck,
  TrendingDown,
  Zap,
  Store,
  Clock,
  Target,
} from "lucide-react";
import { chatWithShopper } from "../services/geminiService";
import { GenerateContentResponse } from "@google/genai";

interface SmartChatProps {
  currentProduct: Product;
  competitors: Product[];
  analysis: AnalysisResult | null;
}

const suggestedQueries = [
  { text: "Is this a good deal?", icon: Target },
  { text: "Should I wait for a sale?", icon: Clock },
  { text: "Better alternatives?", icon: TrendingDown },
  { text: "Which seller is safest?", icon: ShieldCheck },
  { text: "Compare shipping costs", icon: Store },
  { text: "Price drop prediction?", icon: Zap },
];

const quickReplies = ["Tell me more", "Compare sellers", "Any coupons?"];

export const SmartChat: React.FC<SmartChatProps> = ({
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
      className="smart-chat-container overflow-hidden flex flex-col"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45 }}
    >
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 max-h-[320px] min-h-[160px] overflow-y-auto custom-scrollbar px-4 py-3 space-y-3"
      >
        {/* Empty state */}
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center py-6">
            <motion.div
              className="h-12 w-12 rounded-2xl bg-gradient-to-br from-ai-indigo/12 to-ai-purple/12 border border-ai-indigo/10 flex items-center justify-center mb-3"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5 text-ai-indigo/50" />
            </motion.div>
            <p className="text-[12px] font-semibold text-white/50 mb-1">
              Ask SmartCompare AI
            </p>
            <p className="text-[10px] text-white/20 mb-4">
              Get personalized shopping advice
            </p>

            {/* Suggested queries — 2×3 grid */}
            <div className="w-full grid grid-cols-2 gap-1.5">
              {suggestedQueries.map((q, i) => (
                <motion.button
                  key={q.text}
                  onClick={() => handleSend(q.text)}
                  className="chat-suggestion text-left flex items-center gap-2"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <q.icon className="w-3 h-3 text-ai-indigo/50 flex-shrink-0" />
                  <span>{q.text}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        <AnimatePresence>
          {chatHistory.map((msg, idx) => (
            <React.Fragment key={idx}>
              <motion.div
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {msg.role === "model" && (
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-ai-indigo to-ai-purple flex items-center justify-center mr-2 mt-1 flex-shrink-0 shadow-md shadow-ai-indigo/15">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed ${
                    msg.role === "user"
                      ? "chat-bubble-user rounded-br-md"
                      : "chat-bubble-ai rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === "user" && (
                  <div className="h-6 w-6 rounded-lg bg-white/8 flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                    <User className="w-3 h-3 text-white/40" />
                  </div>
                )}
              </motion.div>
              {/* Quick-reply chips after last bot message */}
              {msg.role === "model" &&
                msg.text &&
                idx === chatHistory.length - 1 &&
                !isTyping && (
                  <motion.div
                    className="flex flex-wrap gap-1.5 ml-8 mt-1"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.25 }}
                  >
                    {quickReplies.map((qr) => (
                      <button
                        key={qr}
                        onClick={() => handleSend(qr)}
                        className="text-[9px] font-medium text-ai-indigo/70 bg-ai-indigo/[0.06] border border-ai-indigo/10 px-2.5 py-1 rounded-full hover:bg-ai-indigo/15 hover:border-ai-indigo/20 transition-all duration-200"
                      >
                        {qr}
                      </button>
                    ))}
                  </motion.div>
                )}
            </React.Fragment>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-ai-indigo to-ai-purple flex items-center justify-center flex-shrink-0 shadow-md shadow-ai-indigo/15">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="chat-bubble-ai rounded-2xl rounded-bl-md px-3.5 py-3 flex gap-1.5">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-ai-indigo"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-ai-purple"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-ai-blue"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="relative px-3 py-2.5 border-t border-white/[0.04]">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about this product..."
            className="chat-input flex-1"
          />
          <motion.button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="chat-send-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
