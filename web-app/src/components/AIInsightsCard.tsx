import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

interface Insight {
  text: string;
  highlight: string;
  detail: string;
}

interface AIInsightsCardProps {
  insights: Insight[];
  summary?: string;
}

const AIInsightsCard = ({ insights, summary = "Based on analysis of data across stores, here's my recommendation:" }: AIInsightsCardProps) => {
  const [visibleChars, setVisibleChars] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const fullText = summary;

  useEffect(() => {
    if (visibleChars < fullText.length) {
      const timeout = setTimeout(() => setVisibleChars((v) => v + 1), 25);
      return () => clearTimeout(timeout);
    }
  }, [visibleChars, fullText.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="rounded-2xl glass p-4 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center glow-primary"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </motion.div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">SmartCompare AI</h2>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] text-accent">Analyzing</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          {fullText.slice(0, visibleChars)}
          {visibleChars < fullText.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-0.5 h-3 bg-primary ml-0.5 align-middle"
            />
          )}
        </p>

        <div className="space-y-2">
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5 + i * 0.2, duration: 0.4 }}
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="w-full flex items-start gap-2 rounded-lg bg-secondary/50 p-2.5 hover:bg-secondary/70 transition-colors text-left"
              >
                <ChevronRight className={`w-3 h-3 text-primary mt-0.5 flex-shrink-0 transition-transform duration-200 ${expandedIndex === i ? "rotate-90" : ""}`} />
                <p className="text-xs text-foreground/90 leading-relaxed flex-1">
                  {insight.text.split(`**${insight.highlight}**`).map((part, j) => (
                    <span key={j}>
                      {part}
                      {j === 0 && (
                        <span className="font-semibold text-gradient-primary">{insight.highlight}</span>
                      )}
                    </span>
                  ))}
                </p>
              </button>
              <AnimatePresence>
                {expandedIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-[11px] text-muted-foreground leading-relaxed px-5 py-2">
                      {insight.detail}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AIInsightsCard;
