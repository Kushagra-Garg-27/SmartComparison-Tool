import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Product } from "../types";
import {
  TrendingDown,
  TrendingUp,
  Clock,
  ShieldCheck,
  BarChart2,
  Sparkles,
} from "lucide-react";

interface AIForecastProps {
  currentProduct: Product;
  competitors: Product[];
}

interface Prediction {
  label: string;
  value: string;
  percentage: number;
  icon: React.ReactNode;
  color: string;
  barColor: string;
}

export const AIForecast: React.FC<AIForecastProps> = ({
  currentProduct,
  competitors,
}) => {
  const predictions = useMemo((): Prediction[] => {
    const allProducts = [currentProduct, ...competitors];
    const prices = allProducts.map((p) => p.price).filter(Boolean);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const spread =
      prices.length > 1
        ? ((Math.max(...prices) - Math.min(...prices)) / Math.min(...prices)) *
          100
        : 0;

    // Simulate smart predictions based on available signals
    const isBelow = currentProduct.price < avgPrice;
    const trend = currentProduct.priceTrend;
    const trustScore = currentProduct.sellerTrustScore;

    // Price drop chance: higher if trending down, lower if already a deal
    const dropChance = Math.max(
      5,
      Math.min(
        85,
        Math.round(
          (trend === "down" ? 45 : trend === "up" ? 12 : 25) +
            (isBelow ? -10 : 15) +
            (spread > 20 ? 10 : -5),
        ),
      ),
    );

    // Stability: inverse of volatility
    const stability = Math.max(
      20,
      Math.min(
        95,
        Math.round(100 - spread * 1.5 + (trend === "stable" ? 20 : -10)),
      ),
    );

    // Buy timing score
    const buyNow = Math.max(
      30,
      Math.min(
        98,
        Math.round(
          (isBelow ? 75 : 50) +
            (trend === "down" ? 10 : trend === "up" ? -15 : 0) +
            (trustScore >= 85 ? 8 : -5),
        ),
      ),
    );

    return [
      {
        label: "Chance of price drop",
        value: `${dropChance}%`,
        percentage: dropChance,
        icon: <TrendingDown className="w-3.5 h-3.5" />,
        color: dropChance > 40 ? "text-deal" : "text-white/50",
        barColor:
          dropChance > 40
            ? "from-deal/80 to-deal/30"
            : "from-white/20 to-white/5",
      },
      {
        label: "Price stability (7 days)",
        value: `${stability}%`,
        percentage: stability,
        icon: <BarChart2 className="w-3.5 h-3.5" />,
        color: stability > 60 ? "text-ai-blue" : "text-warning",
        barColor:
          stability > 60
            ? "from-ai-blue/80 to-ai-blue/30"
            : "from-warning/80 to-warning/30",
      },
      {
        label: "Buy now confidence",
        value: `${buyNow}%`,
        percentage: buyNow,
        icon: <ShieldCheck className="w-3.5 h-3.5" />,
        color: buyNow > 65 ? "text-deal" : "text-warning",
        barColor:
          buyNow > 65
            ? "from-deal/80 to-emerald-400/30"
            : "from-warning/80 to-warning/30",
      },
    ];
  }, [currentProduct, competitors]);

  const recommendation = useMemo(() => {
    const buyConf = predictions[2]?.percentage ?? 50;
    const dropChance = predictions[0]?.percentage ?? 25;
    if (buyConf >= 75 && dropChance < 30)
      return {
        text: "Good time to buy. Price is competitive and stable.",
        icon: <ShieldCheck className="w-3.5 h-3.5" />,
      };
    if (dropChance >= 45)
      return {
        text: "Consider waiting. Price may drop further soon.",
        icon: <Clock className="w-3.5 h-3.5" />,
      };
    if (buyConf >= 60)
      return {
        text: "Fair deal. Price is reasonable but not exceptional.",
        icon: <TrendingUp className="w-3.5 h-3.5" />,
      };
    return {
      text: "Monitor this product. Better deals may emerge.",
      icon: <Clock className="w-3.5 h-3.5" />,
    };
  }, [predictions]);

  return (
    <motion.div
      className="ai-forecast-card relative overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.45 }}
    >
      {/* Top glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-radial from-ai-purple/8 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
          <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-ai-purple to-ai-blue flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[13px] font-bold text-white/90 tracking-tight">
              AI Price Forecast
            </h2>
            <p className="text-[9px] text-ai-purple/60">
              Predictive analysis • updated now
            </p>
          </div>
        </div>

        {/* Predictions */}
        <div className="px-4 pb-3 space-y-3">
          {predictions.map((pred, i) => (
            <motion.div
              key={pred.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={pred.color}>{pred.icon}</span>
                  <span className="text-[11px] text-white/55 font-medium">
                    {pred.label}
                  </span>
                </div>
                <span className={`text-[13px] font-bold ${pred.color}`}>
                  {pred.value}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${pred.barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pred.percentage}%` }}
                  transition={{
                    delay: 0.4 + i * 0.12,
                    duration: 0.8,
                    ease: "easeOut",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recommendation */}
        <motion.div
          className="mx-4 mb-4 flex items-start gap-2.5 bg-ai-purple/[0.06] rounded-xl px-3.5 py-2.5 border border-ai-purple/10"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <span className="text-ai-purple mt-0.5">{recommendation.icon}</span>
          <p className="text-[11px] text-white/60 leading-relaxed font-medium">
            {recommendation.text}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};
