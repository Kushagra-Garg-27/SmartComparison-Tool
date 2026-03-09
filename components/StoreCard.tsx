import React from "react";
import { Product } from "../types";
import { PriceBadge } from "./PriceBadge";
import { ShieldCheck, ExternalLink, ShoppingBag } from "lucide-react";
import { resolveMarketplaceUrl } from "../utils/urlUtils";

/** Platform brand colours — used for the accent stripe on each card. */
const PLATFORM_COLORS: Record<string, string> = {
  Amazon: "#FF9900",
  BestBuy: "#0046BE",
  Walmart: "#0071DC",
  eBay: "#E53238",
  Flipkart: "#2874F0",
  Direct: "#6366F1",
};

const PLATFORM_ICONS: Record<string, string> = {
  Amazon: "🅰",
  BestBuy: "🅱",
  Walmart: "🆆",
  eBay: "🅴",
  Flipkart: "🅵",
  Direct: "🔗",
};

interface StoreCardProps {
  product: Product;
  isBestPrice?: boolean;
  isCurrent?: boolean;
  compact?: boolean;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  product,
  isBestPrice = false,
  isCurrent = false,
  compact = false,
}) => {
  const finalUrl = resolveMarketplaceUrl(product);
  const accentColor = PLATFORM_COLORS[product.platform] || "#6366F1";
  const icon = PLATFORM_ICONS[product.platform] || "🔗";

  return (
    <div
      className={`relative group rounded-xl border transition-all duration-200 overflow-hidden ${
        isBestPrice
          ? "border-emerald-300 bg-emerald-50/50 shadow-md shadow-emerald-100/50 ring-1 ring-emerald-200"
          : isCurrent
            ? "border-indigo-200 bg-indigo-50/30"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
      }`}
    >
      {/* Accent stripe */}
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

      <div className={`${compact ? "px-3 py-2.5" : "px-4 py-3"}`}>
        {/* Platform row */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1.5">
            <span className="text-base">{icon}</span>
            <span className="text-xs font-semibold text-gray-900">
              {product.platform}
            </span>
            {isCurrent && (
              <span className="text-[9px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                YOU
              </span>
            )}
          </div>
          {product.sellerTrustScore > 0 && (
            <div className="flex items-center space-x-0.5 text-[10px] text-gray-500">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>{product.sellerTrustScore}%</span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mb-2">
          <PriceBadge
            price={product.price}
            currency={product.currency}
            isBest={isBestPrice}
            size={compact ? "md" : "lg"}
          />
        </div>

        {/* Seller name */}
        <div className="text-[10px] text-gray-400 mb-2 truncate">
          {product.vendor}
        </div>

        {/* CTA */}
        {finalUrl && (
          <a
            href={finalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center w-full text-[11px] font-medium py-1.5 rounded-lg transition-all ${
              isBestPrice
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : isCurrent
                  ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {isCurrent ? (
              <>
                <ExternalLink className="h-3 w-3 mr-1" />
                View Page
              </>
            ) : (
              <>
                <ShoppingBag className="h-3 w-3 mr-1" />
                Open Listing
              </>
            )}
          </a>
        )}
      </div>
    </div>
  );
};
