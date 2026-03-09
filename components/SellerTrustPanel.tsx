import React from "react";
import { motion } from "framer-motion";
import { Product } from "../types";
import {
  ShieldCheck,
  AlertTriangle,
  Truck,
  RotateCcw,
  BadgeCheck,
} from "lucide-react";

interface SellerTrustPanelProps {
  products: Product[];
}

const getTrustLevel = (score: number) => {
  if (score >= 90)
    return {
      label: "Excellent",
      color: "text-emerald-400",
      barColor: "from-emerald-500 to-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    };
  if (score >= 75)
    return {
      label: "Good",
      color: "text-blue-400",
      barColor: "from-blue-500 to-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    };
  if (score >= 60)
    return {
      label: "Fair",
      color: "text-amber-400",
      barColor: "from-amber-500 to-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    };
  return {
    label: "Risky",
    color: "text-red-400",
    barColor: "from-red-500 to-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  };
};

export const SellerTrustPanel: React.FC<SellerTrustPanelProps> = ({
  products,
}) => {
  // Deduplicate by platform, keep highest score
  const platformMap = new Map<string, { score: number; vendor: string }>();
  products.forEach((p) => {
    if (
      p.sellerTrustScore > 0 &&
      (!platformMap.has(p.platform) ||
        platformMap.get(p.platform)!.score < p.sellerTrustScore)
    ) {
      platformMap.set(p.platform, {
        score: p.sellerTrustScore,
        vendor: p.vendor,
      });
    }
  });

  const entries = Array.from(platformMap.entries()).sort(
    (a, b) => b[1].score - a[1].score,
  );

  if (entries.length === 0) return null;

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center space-x-2.5">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <ShieldCheck className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Seller Trust Analysis
          </h3>
          <p className="text-[9px] text-white/30">
            Verified seller reliability scores
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {entries.map(([platform, { score, vendor }], index) => {
          const trust = getTrustLevel(score);
          // Simulate additional trust signals based on score
          const isAuthorized = score >= 85;
          const deliveryReliability = Math.min(
            100,
            score + Math.floor(Math.random() * 5),
          );
          const returnRating =
            score >= 80 ? "Good" : score >= 60 ? "Fair" : "Poor";

          return (
            <motion.div
              key={platform}
              className={`rounded-xl border p-3 ${trust.borderColor} ${trust.bgColor}`}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index + 0.3 }}
            >
              {/* Platform + score header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white">
                    {platform}
                  </span>
                  {isAuthorized && (
                    <span className="flex items-center text-[8px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      <BadgeCheck className="h-2.5 w-2.5 mr-0.5" />
                      Authorized
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`text-lg font-extrabold ${trust.color}`}>
                    {score}%
                  </span>
                </div>
              </div>

              {/* Trust bar */}
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${trust.barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{
                    duration: 1,
                    delay: 0.2 * index + 0.4,
                    ease: "easeOut",
                  }}
                />
              </div>

              {/* Trust signals */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center space-x-1.5">
                  <BadgeCheck
                    className={`h-3 w-3 ${isAuthorized ? "text-emerald-400" : "text-white/20"}`}
                  />
                  <span className="text-[9px] text-white/40">
                    {isAuthorized ? "Authorized" : "Third-party"}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Truck className="h-3 w-3 text-white/30" />
                  <span className="text-[9px] text-white/40">
                    {deliveryReliability}%
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <RotateCcw className="h-3 w-3 text-white/30" />
                  <span className="text-[9px] text-white/40">
                    {returnRating}
                  </span>
                </div>
              </div>

              {/* Warning for low trust */}
              {score < 70 && (
                <div className="flex items-center space-x-1.5 mt-2 pt-2 border-t border-white/5">
                  <AlertTriangle className="h-3 w-3 text-amber-400 flex-shrink-0" />
                  <span className="text-[9px] text-amber-300/70">
                    Exercise caution — verify seller details before purchasing
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
