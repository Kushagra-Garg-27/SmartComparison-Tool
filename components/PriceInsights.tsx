import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { PricePoint } from "../types";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface PriceInsightsProps {
  history: PricePoint[];
  currentPrice: number;
}

export const PriceInsights: React.FC<PriceInsightsProps> = ({
  history,
  currentPrice,
}) => {
  const stats = useMemo(() => {
    if (!history || history.length < 2) return null;
    const prices = history.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = sum / prices.length;
    return { min, max, avg };
  }, [history]);

  if (!stats) {
    return (
      <motion.div
        className="glass-card p-4 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-xs text-white/30">
          Insufficient data for price insights.
        </p>
      </motion.div>
    );
  }

  const { min, max, avg } = stats;
  const range = max - min;
  const position = range === 0 ? 50 : ((currentPrice - min) / range) * 100;
  const clampedPosition = Math.max(0, Math.min(100, position));
  const diffPercent = ((currentPrice - avg) / avg) * 100;

  let verdictColor = "text-white/50";
  let verdictBg = "bg-white/5 border-white/10";
  let verdictIcon = <Minus className="h-3 w-3 mr-1" />;
  let verdictText = "Standard";

  if (diffPercent <= -5) {
    verdictColor = "text-emerald-400";
    verdictBg = "bg-emerald-500/10 border-emerald-500/20";
    verdictIcon = <ArrowDown className="h-3 w-3 mr-1" />;
    verdictText = "Below Average";
  } else if (diffPercent >= 5) {
    verdictColor = "text-amber-400";
    verdictBg = "bg-amber-500/10 border-amber-500/20";
    verdictIcon = <ArrowUp className="h-3 w-3 mr-1" />;
    verdictText = "Above Average";
  }

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
        <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
          30-Day Analysis
        </h3>
        <div
          className={`flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${verdictBg} ${verdictColor}`}
        >
          {verdictIcon}
          {verdictText}
        </div>
      </div>

      <div className="p-4">
        {/* Stat Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5 text-center">
          <div className="flex flex-col bg-white/[0.03] rounded-lg p-2 border border-white/5">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">
              Lowest
            </span>
            <span className="text-sm font-extrabold text-emerald-400">
              ${min.toFixed(0)}
            </span>
          </div>
          <div className="flex flex-col bg-white/[0.03] rounded-lg p-2 border border-white/5">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">
              Average
            </span>
            <span className="text-sm font-extrabold text-white/80">
              ${avg.toFixed(0)}
            </span>
          </div>
          <div className="flex flex-col bg-white/[0.03] rounded-lg p-2 border border-white/5">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">
              Highest
            </span>
            <span className="text-sm font-extrabold text-red-400">
              ${max.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Range Meter */}
        <div className="relative pt-2 pb-1">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500/30 via-white/10 to-amber-500/30 rounded-full w-full" />
          <div
            className="absolute top-0 w-1 h-full flex flex-col items-center justify-center transition-all duration-500"
            style={{ left: `${clampedPosition}%` }}
          >
            <motion.div
              className="h-3.5 w-3.5 bg-indigo-500 rounded-full border-2 border-surface shadow-lg shadow-indigo-500/50 -mt-1"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute top-5 w-20 text-center">
              <span className="text-[9px] font-bold text-indigo-400 block">
                Current
              </span>
              <span className="text-[8px] text-white/30 block">
                ${currentPrice.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-7 text-[10px] text-white/25 text-center leading-relaxed">
          Current price is{" "}
          <span
            className={
              diffPercent < 0
                ? "text-emerald-400 font-medium"
                : "text-amber-400 font-medium"
            }
          >
            {Math.abs(diffPercent).toFixed(1)}%{" "}
            {diffPercent < 0 ? "lower" : "higher"}
          </span>{" "}
          than 30-day average • {history.length} data points
        </div>
      </div>
    </motion.div>
  );
};
