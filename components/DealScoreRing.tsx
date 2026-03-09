import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Product } from "../types";

interface DealScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  delay?: number;
}

export const DealScoreRing: React.FC<DealScoreRingProps> = ({
  score,
  size = 100,
  strokeWidth = 6,
  showLabel = true,
  delay = 0.4,
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 80 ? "#22C55E" : score >= 60 ? "#F59E0B" : "#EF4444";
  const scoreLabel =
    score >= 80 ? "Excellent" : score >= 60 ? "Fair Price" : "Overpriced";
  const glowColor =
    score >= 80
      ? "rgba(34,197,94,0.3)"
      : score >= 60
        ? "rgba(245,158,11,0.3)"
        : "rgba(239,68,68,0.3)";

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(99,102,241,0.06)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ delay, duration: 1.5, ease: "easeOut" }}
          />
          {/* Glow layer */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth * 0.5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              filter: "blur(4px)",
            }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ delay, duration: 1.5, ease: "easeOut" }}
            opacity={0.5}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-extrabold text-white"
            style={{ fontSize: size * 0.24 }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.3, type: "spring", stiffness: 200 }}
          >
            {score}
          </motion.span>
          <span
            className="font-medium text-white/25 uppercase tracking-wider"
            style={{ fontSize: size * 0.08 }}
          >
            / 100
          </span>
        </div>
      </div>
      {showLabel && (
        <motion.span
          className="mt-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: scoreColor }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.6 }}
        >
          {scoreLabel}
        </motion.span>
      )}
    </div>
  );
};

/** Compute deal score from products */
export function computeDealScore(
  allProducts: Product[],
  bestDeal: Product,
): number {
  const prices = allProducts.map((p) => p.price).filter(Boolean);
  if (prices.length <= 1) return 75;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  if (max === min) return 80;

  // Factor in: position vs average, trust score, price trend
  const priceRatio = (avg - bestDeal.price) / (max - min);
  const trustBonus = (bestDeal.sellerTrustScore || 80) > 85 ? 5 : 0;
  const trendBonus =
    bestDeal.priceTrend === "down" ? 3 : bestDeal.priceTrend === "up" ? -3 : 0;
  return Math.min(
    99,
    Math.max(40, Math.round(70 + priceRatio * 30 + trustBonus + trendBonus)),
  );
}
