import React from "react";
import { motion } from "framer-motion";
import { Product } from "../types";
import {
  ShieldCheck,
  ExternalLink,
  ShoppingBag,
  Crown,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { resolveMarketplaceUrl } from "../utils/urlUtils";

const PLATFORM_COLORS: Record<string, string> = {
  Amazon: "#FF9900",
  BestBuy: "#0046BE",
  Walmart: "#0071DC",
  eBay: "#E53238",
  Flipkart: "#2874F0",
  Direct: "#6366F1",
};

interface StoreComparisonCardsProps {
  currentProduct: Product;
  competitors: Product[];
  bestPriceId?: string;
  bestValueId?: string;
  trustWarningId?: string | null;
  onRefreshPrices: () => void;
  isRefreshingPrices: boolean;
  lastUpdated: Date;
}

export const StoreComparisonCards: React.FC<StoreComparisonCardsProps> = ({
  currentProduct,
  competitors,
  bestPriceId,
  bestValueId,
  trustWarningId,
  onRefreshPrices,
  isRefreshingPrices,
  lastUpdated,
}) => {
  const validCompetitors = competitors.filter(
    (c) => c.verificationStatus !== "failed",
  );
  const allProducts = [currentProduct, ...validCompetitors];
  const lowestPrice = Math.min(
    ...allProducts.filter((p) => p.price > 0).map((p) => p.price),
  );

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "INR":
        return "₹";
      case "GBP":
        return "£";
      case "EUR":
        return "€";
      default:
        return "$";
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 75) return "text-blue-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const getTrustBg = (score: number) => {
    if (score >= 90) return "bg-emerald-400/10 border-emerald-400/20";
    if (score >= 75) return "bg-blue-400/10 border-blue-400/20";
    if (score >= 60) return "bg-amber-400/10 border-amber-400/20";
    return "bg-red-400/10 border-red-400/20";
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-white/50">
            Live Prices • Updated{" "}
            {lastUpdated.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <button
          onClick={onRefreshPrices}
          disabled={isRefreshingPrices}
          className="flex items-center text-[11px] font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-all bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/20"
        >
          <RefreshCw
            className={`h-3 w-3 mr-1.5 ${isRefreshingPrices ? "animate-spin" : ""}`}
          />
          {isRefreshingPrices ? "Syncing" : "Refresh"}
        </button>
      </div>

      {/* Cards grid */}
      <div className="p-3 space-y-2">
        {allProducts.length === 1 && competitors.length > 0 && (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            <span className="text-xs text-white/40">
              Validating product availability...
            </span>
          </div>
        )}

        {allProducts.map((p, index) => {
          if (p.id !== currentProduct.id && p.verificationStatus === "failed")
            return null;

          const isBestPrice = p.id === bestPriceId || p.price === lowestPrice;
          const isWarning = p.id === trustWarningId;
          const isCurrent = p.id === currentProduct.id;
          const finalUrl = resolveMarketplaceUrl(p);
          const accentColor =
            PLATFORM_COLORS[p.platform] || PLATFORM_COLORS.Direct;
          const symbol = getCurrencySymbol(p.currency);
          const isSearching = p.verificationStatus === "searching";
          const priceDiff = p.price - lowestPrice;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              className={`relative group rounded-xl border transition-all duration-300 overflow-hidden ${
                isBestPrice
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : isWarning
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
              }`}
            >
              {/* Best price glow */}
              {isBestPrice && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
              )}

              <div className="relative p-3">
                <div className="flex items-center justify-between">
                  {/* Platform + badges */}
                  <div className="flex items-center space-x-2">
                    {/* Colored dot */}
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="text-sm font-semibold text-white">
                      {p.platform}
                    </span>
                    {isCurrent && (
                      <span className="text-[8px] font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Current
                      </span>
                    )}
                    {isBestPrice && (
                      <motion.span
                        className="flex items-center text-[8px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Crown className="h-2.5 w-2.5 mr-0.5" />
                        Best
                      </motion.span>
                    )}
                    {isWarning && (
                      <span className="flex items-center text-[8px] font-bold text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded-full">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                        Risk
                      </span>
                    )}
                  </div>

                  {/* Trust score */}
                  {p.sellerTrustScore > 0 && (
                    <div
                      className={`flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${getTrustBg(p.sellerTrustScore)}`}
                    >
                      <ShieldCheck
                        className={`h-3 w-3 ${getTrustColor(p.sellerTrustScore)}`}
                      />
                      <span className={getTrustColor(p.sellerTrustScore)}>
                        {p.sellerTrustScore}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Price row */}
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-baseline space-x-2">
                    {isSearching ? (
                      <div className="flex items-center space-x-2 text-white/40">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Searching...</span>
                      </div>
                    ) : (
                      <>
                        <span
                          className={`text-xl font-extrabold ${
                            isBestPrice ? "text-emerald-400" : "text-white"
                          }`}
                        >
                          {p.price > 0
                            ? `${symbol}${p.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "N/A"}
                        </span>
                        {!isBestPrice && priceDiff > 0 && (
                          <span className="text-[10px] text-red-400/70 font-medium">
                            +{symbol}
                            {priceDiff.toFixed(0)} more
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* CTA button */}
                  {finalUrl && (
                    <a
                      href={finalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        isBestPrice
                          ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/25"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          Open
                        </>
                      )}
                    </a>
                  )}
                </div>

                {/* Seller name */}
                <p className="text-[10px] text-white/25 mt-1 truncate">
                  Sold by {p.vendor}
                  {p.isAlternative && " • Alternative listing"}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
