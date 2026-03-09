import React, { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Product } from "../types";
import { Crown, TrendingDown, Star, Sparkles, Zap, Shield, Info } from "lucide-react";
import { DealScoreRing, computeDealScore } from "./DealScoreRing";

declare var chrome: any;

/** Floating particles that create depth in the hero area */
const PARTICLES = [
  { x: "12%", y: "20%", size: 3, delay: 0, duration: 4.5, color: "bg-ai-indigo/30" },
  { x: "85%", y: "15%", size: 2, delay: 0.8, duration: 5.2, color: "bg-ai-purple/25" },
  { x: "70%", y: "60%", size: 4, delay: 1.5, duration: 3.8, color: "bg-ai-blue/20" },
  { x: "25%", y: "75%", size: 2, delay: 0.4, duration: 4.8, color: "bg-deal/20" },
  { x: "50%", y: "30%", size: 3, delay: 2, duration: 5, color: "bg-ai-indigo/20" },
  { x: "90%", y: "80%", size: 2, delay: 1.2, duration: 4.2, color: "bg-ai-purple/15" },
];

interface HeroIntelligenceProps {
  product: Product;
  competitors: Product[];
  bestPriceId: string;
}

export const HeroIntelligence: React.FC<HeroIntelligenceProps> = ({
  product,
  competitors,
  bestPriceId,
}) => {
  const allProducts = useMemo(
    () => [product, ...competitors],
    [product, competitors],
  );
  const bestDeal = allProducts.find((p) => p.id === bestPriceId) || product;
  const isBestDealCurrent = bestDeal.id === product.id;

  const savings = useMemo(() => {
    if (competitors.length === 0) return 0;
    const prices = allProducts.map((p) => p.price).filter(Boolean);
    const maxPrice = Math.max(...prices);
    return Math.max(0, maxPrice - bestDeal.price);
  }, [allProducts, bestDeal, competitors.length]);

  const dealScore = useMemo(
    () => computeDealScore(allProducts, bestDeal),
    [allProducts, bestDeal],
  );

  // Broadcast deal score to content script badge
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.runtime?.id && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        const tabId = tabs?.[0]?.id;
        if (typeof tabId === "number") {
          chrome.runtime.sendMessage({
            action: "BROADCAST_DEAL_SCORE",
            tabId,
            score: dealScore,
          });
        }
      });
    }
  }, [dealScore]);

  const currency =
    product.currency === "INR"
      ? "₹"
      : product.currency === "GBP"
        ? "£"
        : product.currency === "EUR"
          ? "€"
          : "$";

  /** Generate contextual deal insights based on available data */
  const dealInsights = useMemo(() => {
    const insights: { text: string; type: "positive" | "neutral" | "warning" }[] = [];
    const prices = allProducts.map((p) => p.price).filter(Boolean);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Price vs average
    if (bestDeal.price < avgPrice * 0.92) {
      const pctBelow = Math.round(((avgPrice - bestDeal.price) / avgPrice) * 100);
      insights.push({ text: `${pctBelow}% below average market price`, type: "positive" });
    }

    // Price trend insight
    if (bestDeal.priceTrend === "down") {
      insights.push({ text: "Price dropped recently — good timing", type: "positive" });
    } else if (bestDeal.priceTrend === "up") {
      insights.push({ text: "Price trending up — consider buying soon", type: "warning" });
    } else if (bestDeal.priceTrend === "stable") {
      insights.push({ text: "Price stable — no rush, but deal is solid", type: "neutral" });
    }

    // Seller trust
    if (bestDeal.sellerTrustScore >= 90) {
      insights.push({ text: `Top-rated seller (${bestDeal.sellerTrustScore}% trust)`, type: "positive" });
    } else if (bestDeal.sellerTrustScore > 0 && bestDeal.sellerTrustScore < 70) {
      insights.push({ text: "Seller trust score is low — verify before buying", type: "warning" });
    }

    // Competitor spread
    if (allProducts.length >= 3 && savings > 0) {
      insights.push({ text: `Compared across ${allProducts.length} stores for you`, type: "neutral" });
    }

    // Average price insight
    if (bestDeal.averagePrice && bestDeal.price < bestDeal.averagePrice) {
      insights.push({ text: `Near ${Math.round(((bestDeal.averagePrice - bestDeal.price) / bestDeal.averagePrice) * 100)}% below typical price`, type: "positive" });
    }

    return insights.slice(0, 3);
  }, [allProducts, bestDeal, savings]);
  const scoreColor =
    dealScore >= 80
      ? "text-deal"
      : dealScore >= 60
        ? "text-warning"
        : "text-risk";
  const scoreLabel =
    dealScore >= 80
      ? "Excellent Deal"
      : dealScore >= 60
        ? "Fair Price"
        : "Overpriced";

  return (
    <motion.div
      className="relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Layered background: deep space + radial hero glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-space-50 via-space to-space" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-60 hero-radial-glow" />
      <div className="absolute -top-10 -right-10 w-[180px] h-[180px] bg-gradient-radial from-ai-blue/8 to-transparent rounded-full blur-3xl" />

      {/* Floating particles — depth + premium feel */}
      {PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${p.color} pointer-events-none`}
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          animate={{
            y: [0, -12, -4, -16, 0],
            x: [0, 4, -3, 5, 0],
            opacity: [0.3, 0.8, 0.5, 0.7, 0.3],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}

      <div className="relative z-10 px-5 pt-5 pb-4">
        {/* Crown badge — bold emotional anchor */}
        <motion.div
          className="flex items-center justify-center mb-3"
          initial={{ opacity: 0, y: -12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.15,
            duration: 0.5,
            type: "spring",
            stiffness: 260,
          }}
        >
          <div className="hero-deal-badge hero-deal-badge-pulse">
            <Crown className="w-3 h-3" />
            <span>Best Deal Detected</span>
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                opacity: [0, 0.6, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ boxShadow: "0 0 24px rgba(34,197,94,0.5)" }}
            />
          </div>
        </motion.div>

        {/* Hero layout: Image + Score side by side */}
        <div className="flex items-center gap-4 mb-3">
          {/* Product image with dramatic radial glow */}
          <motion.div
            className="relative flex-shrink-0"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.2,
              duration: 0.6,
              type: "spring",
              stiffness: 200,
            }}
          >
            <div className="absolute inset-0 bg-gradient-radial from-ai-indigo/25 via-ai-purple/10 to-transparent rounded-full blur-2xl scale-[2]" />
            <div className="relative h-[72px] w-[72px] rounded-2xl bg-space-100/60 border border-white/[0.06] overflow-hidden backdrop-blur-sm hero-image-ring">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-ai-indigo/30" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Product info + rating */}
          <motion.div
            className="flex-1 min-w-0"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <h1 className="text-[14px] font-bold text-white/95 leading-snug line-clamp-2">
              {product.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {product.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  <span className="text-[11px] font-semibold text-white/60">
                    {product.rating}
                  </span>
                  {product.reviewCount > 0 && (
                    <span className="text-[9px] text-white/25">
                      ({product.reviewCount.toLocaleString()})
                    </span>
                  )}
                </div>
              )}
              <span className="text-[9px] text-white/20 uppercase tracking-wider">
                {product.platform}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Primary intelligence card — price + deal score + savings */}
        <motion.div
          className="hero-intel-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            {/* Left: price + source */}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold text-white/25 uppercase tracking-widest mb-1">
                {isBestDealCurrent
                  ? "Your Price"
                  : `Best on ${bestDeal.vendor}`}
              </p>
              <motion.p
                className="text-[28px] font-extrabold text-white tracking-tight leading-none"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                {currency}
                {bestDeal.price.toLocaleString()}
              </motion.p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[10px] font-bold ${scoreColor}`}>
                  {scoreLabel}
                </span>
                <span className="text-[9px] text-white/15">•</span>
                <span className="text-[9px] text-white/25">
                  {allProducts.length} stores
                </span>
              </div>
            </div>

            {/* Right: Deal Score Ring with interpretation */}
            <div className="flex flex-col items-center">
              <DealScoreRing
                score={dealScore}
                size={72}
                strokeWidth={5}
                showLabel={false}
                delay={0.5}
              />
              <motion.span
                className={`mt-1 text-[8px] font-bold uppercase tracking-wider ${scoreColor}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {scoreLabel}
              </motion.span>
            </div>
          </div>

          {/* Savings strip — prominent if savings exist */}
          {savings > 0 && (
            <motion.div
              className="mt-3 hero-savings-strip hero-savings-pulse"
              initial={{ opacity: 0, scaleX: 0.85 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.65, duration: 0.4 }}
            >
              <div className="flex items-center gap-2.5">
                <motion.div
                  className="h-7 w-7 rounded-lg bg-deal/15 flex items-center justify-center flex-shrink-0"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <TrendingDown className="w-3.5 h-3.5 text-deal" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-extrabold text-deal leading-tight">
                    Save {currency}
                    {savings.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-deal/50">
                    vs highest across {allProducts.length} stores
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Shield className="w-3 h-3 text-deal/40" />
                  <Zap className="w-3.5 h-3.5 text-deal/50" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Deal Intelligence Insights */}
          {dealInsights.length > 0 && (
            <motion.div
              className="mt-3 space-y-1.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              {dealInsights.map((insight, i) => (
                <motion.div
                  key={i}
                  className={`deal-insight-chip ${
                    insight.type === "positive"
                      ? "deal-insight-positive"
                      : insight.type === "warning"
                        ? "deal-insight-warning"
                        : "deal-insight-neutral"
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85 + i * 0.1 }}
                >
                  <Info className="w-3 h-3 flex-shrink-0" />
                  <span className="text-[10px] leading-tight">{insight.text}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom neon separator */}
      <div className="neon-line" />
    </motion.div>
  );
};
