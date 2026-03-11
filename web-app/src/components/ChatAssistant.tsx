import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, User, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { chatService } from "@/services/api";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface ProductContext {
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

interface ChatAssistantProps {
  productContext: ProductContext;
}

const suggestions = [
  "Is this a good deal?",
  "Should I wait for a sale?",
  "Which seller is safest?",
];

const ChatAssistant = ({ productContext }: ChatAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", content: "Hi! I'm SmartCompare AI. Ask me anything about this product — pricing, seller trust, or whether to buy now." },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: Message = { id: Date.now(), role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    let assistantContent = "";

    try {
      const resp = await chatService.sendMessage(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        productContext
      );

      if (!resp.body) {
        throw new Error("AI unavailable");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id === -1) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { id: -1, role: "assistant", content: assistantContent }];
              });
            }
          } catch { /* partial chunk */ }
        }
      }

      // Finalize message with proper id
      setMessages(prev => prev.map(m => m.id === -1 ? { ...m, id: Date.now() + 1 } : m));
    } catch (e: any) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: e.message || "Sorry, I couldn't process that. Try again." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
      className="rounded-2xl glass p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">AI Shopping Advisor</h2>
        <div className="ml-auto flex items-center gap-1 bg-accent/15 rounded-full px-2 py-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[9px] text-accent font-medium">Live AI</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="space-y-2.5 max-h-48 overflow-y-auto mb-3 pr-1">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "assistant" ? "gradient-primary" : "bg-secondary"
              }`}>
                {msg.role === "assistant" ? (
                  <Sparkles className="w-3 h-3 text-primary-foreground" />
                ) : (
                  <User className="w-3 h-3 text-foreground" />
                )}
              </div>
              <div className={`rounded-xl px-3 py-2 max-w-[80%] ${
                msg.role === "assistant"
                  ? "bg-secondary/60 text-foreground"
                  : "gradient-primary text-primary-foreground"
              }`}>
                <p className="text-xs leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
            <div className="bg-secondary/60 rounded-xl px-3 py-2 flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {suggestions.map((s) => (
          <motion.button
            key={s}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => sendMessage(s)}
            disabled={isStreaming}
            className="text-[10px] px-2.5 py-1.5 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border/50 disabled:opacity-50"
          >
            {s}
          </motion.button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask about price, seller trust, timing..."
          disabled={isStreaming}
          className="flex-1 bg-secondary/60 border border-border/50 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => sendMessage(input)}
          disabled={isStreaming}
          className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center glow-primary disabled:opacity-50"
        >
          {isStreaming ? (
            <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5 text-primary-foreground" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ChatAssistant;
