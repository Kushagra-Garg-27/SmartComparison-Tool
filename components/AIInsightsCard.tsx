import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Product, AnalysisResult } from "../types";
import {
  Sparkles,
  Bot,
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronRight,
  Lightbulb,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface AIInsightsCardProps {
  currentProduct: Product;
  competitors: Product[];
  analysis: AnalysisResult;
}

/** Typing animation hook — reveals text character by character */
const useTypingEffect = (text: string, speed: number = 15) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
};

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({
  currentProduct,
  competitors,
  analysis,
}) => {
  const allProducts = [currentProduct, ...competitors];
  const allPrices = allProducts.filter((p) => p.price > 0).map((p) => p.price);
  const avgPrice =
    allPrices.length > 0
      ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length
      : 0;
  const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const bestPlatform =
    allProducts.find((p) => p.price === lowestPrice)?.platform || "—";

  // Build insightful text for typing effect
  const insightText =
    analysis.recommendation ||
    `Based on analysis of ${allProducts.length} stores, ${bestPlatform} offers the best value at $${lowestPrice.toFixed(2)}.`;

  const { displayed, done } = useTypingEffect(insightText, 20);

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {/* AI Header with glow */}
      <div className="relative px-4 py-3 border-b border-white/5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 pointer-events-none" />
        <div className="relative flex items-center space-x-2.5">
          <motion.div
            className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              SmartCompare AI Insight
            </h3>
            <p className="text-[9px] text-white/30">Powered by Gemini</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* AI Recommendation with typing effect */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/15 p-3.5">
          <div className="flex items-start space-x-2.5">
            <Bot className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-white/80 leading-relaxed">
                {displayed}
                {!done && (
                  <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse" />
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Quick AI summary bullets */}
        <div className="space-y-2">
          {lowestPrice > 0 && (
            <motion.div
              className="flex items-center space-x-2 text-xs text-white/60"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TrendingDown className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
              <span>
                Best price:{" "}
                <span className="font-semibold text-emerald-400">
                  {bestPlatform} ${lowestPrice.toFixed(2)}
                </span>
              </span>
            </motion.div>
          )}
          {avgPrice > 0 && (
            <motion.div
              className="flex items-center space-x-2 text-xs text-white/60"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Minus className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
              <span>
                Market average:{" "}
                <span className="font-semibold text-white/80">
                  ${avgPrice.toFixed(2)}
                </span>
              </span>
            </motion.div>
          )}
          {currentProduct.priceTrend && (
            <motion.div
              className="flex items-center space-x-2 text-xs text-white/60"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              {currentProduct.priceTrend === "down" ? (
                <TrendingDown className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
              ) : currentProduct.priceTrend === "up" ? (
                <TrendingUp className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
              )}
              <span>
                Trend:{" "}
                <span className="font-semibold capitalize text-white/80">
                  {currentProduct.priceTrend}
                </span>
              </span>
            </motion.div>
          )}
        </div>

        {/* AI Summary text */}
        {analysis.summary && (
          <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/15 p-3.5">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <h4 className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                Summary
              </h4>
            </div>
            <p className="text-[11px] text-amber-200/70 leading-relaxed">
              {analysis.summary}
            </p>
          </div>
        )}

        {/* Pros & Cons */}
        {(analysis.pros.length > 0 || analysis.cons.length > 0) && (
          <div className="grid grid-cols-1 gap-2">
            {analysis.pros.length > 0 && (
              <motion.div
                className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Pros
                </h4>
                <ul className="space-y-1">
                  {analysis.pros.slice(0, 3).map((p, i) => (
                    <li
                      key={i}
                      className="flex items-start text-[11px] text-emerald-300/70"
                    >
                      <ChevronRight className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0 text-emerald-500/50" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
            {analysis.cons.length > 0 && (
              <motion.div
                className="rounded-xl bg-red-500/5 border border-red-500/15 p-3"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center">
                  <XCircle className="h-3 w-3 mr-1" />
                  Cons
                </h4>
                <ul className="space-y-1">
                  {analysis.cons.slice(0, 3).map((c, i) => (
                    <li
                      key={i}
                      className="flex items-start text-[11px] text-red-300/70"
                    >
                      <ChevronRight className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0 text-red-500/50" />
                      {c}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
