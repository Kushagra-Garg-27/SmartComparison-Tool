import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Product } from "../types";
import { Zap, TrendingDown, BarChart3, Flame } from "lucide-react";

interface DealRadarProps {
  product: Product;
  competitors: Product[];
  bestPriceId: string;
}

export const DealRadar: React.FC<DealRadarProps> = ({
  product,
  competitors,
  bestPriceId,
}) => {
  const allProducts = [product, ...competitors];
  const bestDeal = allProducts.find((p) => p.id === bestPriceId) || product;
  const prices = allProducts.map((p) => p.price).filter(Boolean);

  const dealScore = useMemo(() => {
    if (prices.length <= 1) return 75;
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    if (max === min) return 80;
    const ratio = (avg - bestDeal.price) / (max - min);
    return Math.min(99, Math.max(40, Math.round(70 + ratio * 30)));
  }, [prices, bestDeal]);

  // Price percentile (how low is this price vs range)
  const percentile = useMemo(() => {
    if (prices.length <= 1) return 30;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    if (max === min) return 50;
    return Math.round(((max - bestDeal.price) / (max - min)) * 100);
  }, [prices, bestDeal]);

  // Simulated prediction confidence
  const dropProbability = useMemo(() => {
    if (product.priceTrend === "down")
      return Math.floor(Math.random() * 15) + 25;
    if (product.priceTrend === "up") return Math.floor(Math.random() * 10) + 5;
    return Math.floor(Math.random() * 15) + 12;
  }, [product.priceTrend]);

  const scoreColor =
    dealScore >= 80 ? "#22C55E" : dealScore >= 60 ? "#F59E0B" : "#EF4444";
  const scoreLabel =
    dealScore >= 80
      ? "Great Deal"
      : dealScore >= 60
        ? "Fair Price"
        : "Overpriced";

  const ringRadius = 42;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (dealScore / 100) * circumference;

  return (
    <motion.div
      className="glass-section p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-ai-indigo/20 to-ai-purple/20 flex items-center justify-center">
          <Zap className="w-3 h-3 text-ai-indigo" />
        </div>
        <h2 className="text-[13px] font-bold text-white/90 tracking-tight">
          Deal Radar
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Animated score ring */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              stroke="rgba(99,102,241,0.08)"
              strokeWidth="6"
            />
            {/* Score fill */}
            <motion.circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
              }}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ delay: 0.4, duration: 1.5, ease: "easeOut" }}
            />
            {/* Glow filter */}
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <motion.circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "50% 50%",
                filter: "url(#glow)",
              }}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ delay: 0.4, duration: 1.5, ease: "easeOut" }}
              opacity={0.4}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-[22px] font-extrabold text-white"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            >
              {dealScore}
            </motion.span>
            <span className="text-[8px] font-medium text-white/30 uppercase tracking-wider">
              / 100
            </span>
          </div>
        </div>

        {/* Deal metrics */}
        <div className="flex-1 space-y-2.5">
          {/* Score label */}
          <motion.div
            className="px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5"
            style={{
              background: `${scoreColor}15`,
              border: `1px solid ${scoreColor}25`,
            }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Flame className="w-3 h-3" style={{ color: scoreColor }} />
            <span
              className="text-[11px] font-bold"
              style={{ color: scoreColor }}
            >
              {scoreLabel}
            </span>
          </motion.div>

          {/* Price position */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <TrendingDown className="w-3.5 h-3.5 text-ai-blue/60" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/40">
                  Price Percentile
                </span>
                <span className="text-[10px] font-semibold text-white/70">
                  Top {100 - percentile}%
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}80)`,
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${percentile}%` }}
                  transition={{ delay: 0.9, duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>

          {/* Drop probability */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <BarChart3 className="w-3.5 h-3.5 text-ai-purple/60" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40">
                  Drop Probability
                </span>
                <span className="text-[10px] font-semibold text-white/70">
                  {dropProbability}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Historical low indicator */}
          <motion.p
            className="text-[10px] text-ai-blue/70 flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-ai-blue animate-pulse" />
            Near 60-day low price range
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};
