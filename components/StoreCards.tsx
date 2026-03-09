import React from "react";
import { motion } from "framer-motion";
import { Product } from "../types";
import {
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Crown,
  Truck,
  Clock,
  ShoppingBag,
  Flame,
} from "lucide-react";

interface StoreCardsProps {
  currentProduct: Product;
  competitors: Product[];
  bestPriceId: string;
  bestValueId: string;
  trustWarningId: string | null;
  onRefreshPrices: () => void;
  isRefreshingPrices: boolean;
  lastUpdated: Date;
}

const platformColors: Record<string, string> = {
  Amazon: "#FF9900",
  eBay: "#E53238",
  BestBuy: "#0046BE",
  Walmart: "#0071DC",
  Flipkart: "#2874F0",
  Direct: "#6366F1",
};

const getTrustColor = (score: number) => {
  if (score >= 90) return "text-emerald-400";
  if (score >= 75) return "text-blue-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
};

export const StoreCards: React.FC<StoreCardsProps> = ({
  currentProduct,
  competitors,
  bestPriceId,
  bestValueId,
  trustWarningId,
  onRefreshPrices,
  isRefreshingPrices,
  lastUpdated,
}) => {
  const allProducts = [currentProduct, ...competitors];
  const lowestPrice = Math.min(
    ...allProducts.filter((p) => p.price > 0).map((p) => p.price),
  );
  const currency =
    currentProduct.currency === "INR"
      ? "₹"
      : currentProduct.currency === "GBP"
        ? "£"
        : currentProduct.currency === "EUR"
          ? "€"
          : "$";

  const handleBuy = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (url && /^https?:\/\//.test(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Sort: best deal first
  const sorted = [...allProducts].sort((a, b) => {
    if (a.id === bestPriceId) return -1;
    if (b.id === bestPriceId) return 1;
    return a.price - b.price;
  });

  return (
    <div>
      {/* Section header with refresh */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-ai-blue/20 to-ai-indigo/20 flex items-center justify-center">
            <ShoppingBag className="w-3 h-3 text-ai-blue" />
          </div>
          <h2 className="text-[13px] font-bold text-white/90 tracking-tight">
            Store Comparison
          </h2>
        </div>
        <button
          onClick={onRefreshPrices}
          disabled={isRefreshingPrices}
          className="flex items-center gap-1.5 text-[10px] font-medium text-ai-indigo/70 hover:text-ai-indigo bg-ai-indigo/5 hover:bg-ai-indigo/10 border border-ai-indigo/10 px-2.5 py-1.5 rounded-lg transition-all duration-200"
        >
          <RefreshCw
            className={`w-3 h-3 ${isRefreshingPrices ? "animate-spin" : ""}`}
          />
          {isRefreshingPrices ? "Syncing" : "Refresh"}
        </button>
      </div>

      {/* Store cards */}
      <div className="space-y-2">
        {sorted.map((product, idx) => {
          const isBestPrice =
            product.id === bestPriceId || product.price === lowestPrice;
          const isBestValue = product.id === bestValueId && !isBestPrice;
          const hasTrustWarning = product.id === trustWarningId;
          const brandColor = platformColors[product.platform] || "#6366F1";
          const priceDiff = product.price - lowestPrice;
          const isCurrent = product.id === currentProduct.id;

          return (
            <motion.div
              key={product.id}
              className={`store-card group ${isBestPrice ? "store-card-best store-card-best-glow" : ""}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.35 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              {/* Best deal shimmer strip */}
              {isBestPrice && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-deal to-transparent shimmer-strip" />
              )}

              <div className={`relative ${isBestPrice ? "p-4" : "p-3"}`}>
                <div className="flex items-center gap-3">
                  {/* Platform badge */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-[11px]"
                      style={{
                        background: `${brandColor}10`,
                        border: `1px solid ${brandColor}18`,
                        color: brandColor,
                      }}
                    >
                      {product.platform.slice(0, 2).toUpperCase()}
                    </div>
                    {isBestPrice && (
                      <motion.div
                        className="absolute -top-2 -right-2 h-5.5 w-5.5 rounded-full bg-gradient-to-br from-deal to-emerald-400 flex items-center justify-center shadow-lg shadow-deal/40 crown-badge-glow"
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: 0.3 + idx * 0.06,
                          type: "spring",
                          stiffness: 300,
                        }}
                      >
                        <Crown className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </div>

                  {/* Store info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[12px] font-semibold truncate ${isBestPrice ? "text-white" : "text-white/80"}`}
                      >
                        {product.vendor}
                      </span>
                      {isCurrent && (
                        <span className="text-[8px] font-bold text-ai-indigo/70 bg-ai-indigo/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          You
                        </span>
                      )}
                      {product.verificationStatus === "verified" && (
                        <ShieldCheck className="w-3 h-3 text-ai-blue/50 flex-shrink-0" />
                      )}
                      {hasTrustWarning && (
                        <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.sellerTrustScore > 0 && (
                        <span
                          className={`text-[10px] font-medium ${getTrustColor(product.sellerTrustScore)}`}
                        >
                          {product.sellerTrustScore}% trust
                        </span>
                      )}
                      {product.condition !== "New" && (
                        <span className="text-[9px] text-white/25">
                          {product.condition}
                        </span>
                      )}
                      {product.shipping && (
                        <span className="text-[9px] text-white/20 flex items-center gap-0.5">
                          <Truck className="w-2.5 h-2.5" />
                          {product.shipping}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price column */}
                  <div className="text-right flex-shrink-0">
                    <motion.p
                      className={`text-[17px] font-extrabold tracking-tight leading-tight ${
                        isBestPrice ? "text-deal" : "text-white/90"
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + idx * 0.06 }}
                    >
                      {product.price > 0
                        ? `${currency}${product.price.toLocaleString()}`
                        : "N/A"}
                    </motion.p>
                    {isBestPrice && (
                      <span className="text-[9px] font-bold text-deal/90 flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5" />
                        Best Price
                      </span>
                    )}
                    {!isBestPrice && priceDiff > 0 && (
                      <span className="text-[9px] text-red-400/60">
                        +{currency}
                        {priceDiff.toFixed(0)}{" "}
                        <span className="text-red-400/40">
                          (
                          {lowestPrice > 0
                            ? ((priceDiff / lowestPrice) * 100).toFixed(0)
                            : 0}
                          % more)
                        </span>
                      </span>
                    )}
                    {isBestValue && (
                      <span className="text-[9px] font-semibold text-ai-blue/70">
                        Best Value
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <motion.button
                    onClick={(e) => handleBuy(e, product.url)}
                    className={`flex-shrink-0 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      isBestPrice
                        ? "h-9 w-9 bg-gradient-to-br from-deal to-emerald-400 text-white shadow-lg shadow-deal/25 hover:shadow-deal/50"
                        : "h-8 w-8 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.93 }}
                  >
                    <ExternalLink
                      className={isBestPrice ? "w-4 h-4" : "w-3.5 h-3.5"}
                    />
                  </motion.button>
                </div>

                {/* Badge row */}
                {(isBestPrice || isBestValue) && (
                  <motion.div
                    className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.04]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + idx * 0.06 }}
                  >
                    {isBestPrice && (
                      <span className="text-[8px] font-bold text-deal bg-deal/8 px-2 py-0.5 rounded-full border border-deal/12 uppercase tracking-wider">
                        Lowest Price
                      </span>
                    )}
                    {isBestValue && (
                      <span className="text-[8px] font-bold text-ai-blue bg-ai-blue/8 px-2 py-0.5 rounded-full border border-ai-blue/12 uppercase tracking-wider">
                        Best Value
                      </span>
                    )}
                    {product.isAlternative && (
                      <span className="text-[8px] text-white/25 bg-white/5 px-2 py-0.5 rounded-full">
                        Alternative
                      </span>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Timestamp */}
      <div className="flex items-center justify-center gap-1 mt-3">
        <Clock className="w-2.5 h-2.5 text-white/15" />
        <span className="text-[9px] text-white/15">
          Updated{" "}
          {lastUpdated.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};
