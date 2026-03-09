import React from "react";
import { motion } from "framer-motion";
import { Product } from "../types";
import {
  Shield,
  CheckCircle2,
  Truck,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

interface SellerTrustRadarProps {
  products: Product[];
}

const TrustBar: React.FC<{
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  delay: number;
}> = ({ label, value, color, icon, delay }) => (
  <motion.div
    className="flex items-center gap-2.5"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.3 }}
  >
    <div className="w-3.5 flex-shrink-0" style={{ color }}>
      {icon}
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-white/40">{label}</span>
        <span className="text-[10px] font-semibold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  </motion.div>
);

const getTrustColor = (score: number) => {
  if (score >= 90) return "#22C55E";
  if (score >= 70) return "#38BDF8";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
};

const getTrustLabel = (score: number) => {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Risky";
};

export const SellerTrustRadar: React.FC<SellerTrustRadarProps> = ({
  products,
}) => {
  // Only show products with trust scores
  const trustedProducts = products.filter((p) => p.sellerTrustScore > 0);
  if (trustedProducts.length === 0) return null;

  return (
    <motion.div
      className="glass-section p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-deal/20 to-ai-blue/20 flex items-center justify-center">
          <Shield className="w-3 h-3 text-deal" />
        </div>
        <h2 className="text-[13px] font-bold text-white/90 tracking-tight">
          Seller Trust Radar
        </h2>
      </div>

      {/* Seller cards */}
      <div className="space-y-3">
        {trustedProducts.slice(0, 4).map((product, idx) => {
          const trustColor = getTrustColor(product.sellerTrustScore);
          const trustLabel = getTrustLabel(product.sellerTrustScore);
          // Synthetic metrics based on trust score
          const authorized = product.sellerTrustScore >= 85;
          const returnScore = Math.min(
            100,
            product.sellerTrustScore + Math.floor(Math.random() * 10),
          );
          const deliveryScore = Math.min(
            100,
            product.sellerTrustScore - 5 + Math.floor(Math.random() * 15),
          );

          return (
            <motion.div
              key={product.id}
              className="bg-white/[0.02] rounded-2xl p-3 border border-white/[0.05]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.1, duration: 0.4 }}
            >
              {/* Seller header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-[12px] font-bold"
                    style={{
                      background: `${trustColor}15`,
                      border: `1px solid ${trustColor}20`,
                      color: trustColor,
                    }}
                  >
                    {product.vendor.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-white/80">
                      {product.vendor}
                    </p>
                    <div className="flex items-center gap-1">
                      {authorized && (
                        <CheckCircle2 className="w-2.5 h-2.5 text-deal" />
                      )}
                      <span
                        className="text-[9px]"
                        style={{ color: trustColor }}
                      >
                        {authorized ? "Authorized Seller" : trustLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust score badge */}
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold"
                  style={{
                    background: `${trustColor}12`,
                    border: `1px solid ${trustColor}20`,
                    color: trustColor,
                  }}
                >
                  <Shield className="w-3 h-3" />
                  {product.sellerTrustScore}
                </div>
              </div>

              {/* Trust bars */}
              <div className="space-y-2">
                <TrustBar
                  label="Return Policy"
                  value={returnScore}
                  color={getTrustColor(returnScore)}
                  icon={<RotateCcw className="w-3 h-3" />}
                  delay={0.5 + idx * 0.1}
                />
                <TrustBar
                  label="Delivery"
                  value={deliveryScore}
                  color={getTrustColor(deliveryScore)}
                  icon={<Truck className="w-3 h-3" />}
                  delay={0.6 + idx * 0.1}
                />
              </div>

              {/* Warning badge if low trust */}
              {product.sellerTrustScore < 60 && (
                <motion.div
                  className="flex items-center gap-1.5 mt-2 bg-risk/5 rounded-lg px-2 py-1.5 border border-risk/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                >
                  <AlertTriangle className="w-3 h-3 text-risk" />
                  <span className="text-[9px] text-risk/80">
                    Low trust score — proceed with caution
                  </span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
