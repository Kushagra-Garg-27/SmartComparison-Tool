import React from "react";
import { Product } from "../types";
import {
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  BadgeCheck,
  Loader2,
  Search,
  ArrowLeftRight,
  ShoppingBag,
} from "lucide-react";
import { resolveMarketplaceUrl } from "../utils/urlUtils";

interface ComparisonTableProps {
  currentProduct: Product;
  competitors: Product[];
  bestPriceId: string | undefined;
  bestValueId: string | undefined;
  trustWarningId: string | null | undefined;
  onRefreshPrices: () => void;
  isRefreshingPrices: boolean;
  lastUpdated: Date;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  currentProduct,
  competitors,
  bestPriceId,
  bestValueId,
  trustWarningId,
  onRefreshPrices,
  isRefreshingPrices,
  lastUpdated,
}) => {
  // Filter out failed validations that couldn't be repaired
  const validCompetitors = competitors.filter(
    (c) => c.verificationStatus !== "failed",
  );
  const allProducts = [currentProduct, ...validCompetitors];

  const getTrendIcon = (trend?: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case "down":
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  const getPriceContext = (price: number, average?: number) => {
    if (!average) return null;
    const diff = ((average - price) / average) * 100;
    if (diff > 5)
      return (
        <span className="text-[10px] text-green-600 font-medium">
          -{diff.toFixed(0)}% vs Avg
        </span>
      );
    if (diff < -5)
      return (
        <span className="text-[10px] text-red-500 font-medium">
          +{Math.abs(diff).toFixed(0)}% vs Avg
        </span>
      );
    return <span className="text-[10px] text-gray-400">Avg Market Price</span>;
  };

  return (
    <div className="overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-gray-500 font-medium">
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
          className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors bg-white px-2 py-1 rounded border border-gray-200 hover:border-blue-300 shadow-sm"
        >
          <RefreshCw
            className={`h-3 w-3 mr-1.5 ${isRefreshingPrices ? "animate-spin" : ""}`}
          />
          {isRefreshingPrices ? "Syncing..." : "Refresh"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Store
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Product
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Price
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Trust
              </th>
              <th
                scope="col"
                className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody
            className={`bg-white divide-y divide-gray-200 transition-opacity duration-200 ${isRefreshingPrices ? "opacity-50" : "opacity-100"}`}
          >
            {allProducts.length === 1 && competitors.length > 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-sm text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span>Validating product availability...</span>
                  </div>
                </td>
              </tr>
            )}

            {allProducts.length === 1 && competitors.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-sm text-gray-500"
                >
                  No competitors found in stock.
                </td>
              </tr>
            )}

            {allProducts.map((p) => {
              // Current product is always displayed
              if (
                p.id !== currentProduct.id &&
                p.verificationStatus === "failed"
              )
                return null;

              const isBestPrice = p.id === bestPriceId;
              const isBestValue = p.id === bestValueId;
              const isWarning = p.id === trustWarningId;
              const finalUrl = resolveMarketplaceUrl(p);
              const hasUrl = finalUrl.length > 0;

              const isSearching = p.verificationStatus === "searching";
              const isVerified = p.verificationStatus === "verified";
              const isAlternative = p.isAlternative;
              const isCurrent = p.id === currentProduct.id;

              // Truncate title for display
              const displayTitle =
                p.title.length > 50 ? p.title.slice(0, 47) + "..." : p.title;

              return (
                <tr
                  key={p.id}
                  className={
                    isCurrent
                      ? "bg-blue-50"
                      : "hover:bg-gray-50 transition-colors"
                  }
                >
                  {/* Store column */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {p.platform}
                        </span>
                        {isVerified && !isAlternative && (
                          <BadgeCheck
                            className="h-3 w-3 text-blue-500"
                            aria-label="Verified Link"
                          />
                        )}
                        {isAlternative && (
                          <span
                            className="flex items-center text-[10px] text-orange-600 bg-orange-100 px-1 rounded border border-orange-200"
                            title="Original link invalid, alternative found"
                          >
                            <ArrowLeftRight className="h-2 w-2 mr-0.5" />
                            Alt
                          </span>
                        )}
                        {isSearching && (
                          <Loader2 className="h-3 w-3 text-gray-400 animate-spin" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {p.vendor}
                      </span>
                    </div>
                  </td>

                  {/* Product title column */}
                  <td className="px-3 py-3">
                    <div className="flex flex-col max-w-[180px]">
                      <span
                        className="text-xs text-gray-700 truncate"
                        title={p.title}
                      >
                        {displayTitle}
                      </span>
                      {p.condition && p.condition !== "New" && (
                        <span className="text-[10px] text-amber-600 font-medium">
                          {p.condition}
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] text-blue-600 font-medium">
                          Current Page
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Price column */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1">
                        <div className="text-sm font-bold text-gray-900">
                          {p.price > 0 ? (
                            `$${p.price.toFixed(2)}`
                          ) : (
                            <span className="text-amber-500 text-xs font-normal italic">
                              Price unavailable
                            </span>
                          )}
                        </div>
                        {p.priceTrend && (
                          <div title={`Price is ${p.priceTrend}`}>
                            {getTrendIcon(p.priceTrend)}
                          </div>
                        )}
                      </div>
                      {getPriceContext(p.price, p.averagePrice)}
                    </div>
                    {isBestPrice && (
                      <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                        Best Price
                      </span>
                    )}
                    {isBestValue && (
                      <span className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                        <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                        Best Value
                      </span>
                    )}
                  </td>

                  {/* Trust column */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span
                        className={`text-sm font-medium ${p.sellerTrustScore < 70 ? "text-red-600" : "text-gray-900"}`}
                      >
                        {p.sellerTrustScore > 0
                          ? `${p.sellerTrustScore}%`
                          : "—"}
                      </span>
                      {isWarning && (
                        <AlertTriangle className="ml-1 h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </td>

                  {/* Action column — Open Listing button */}
                  <td className="px-3 py-3 whitespace-nowrap text-right">
                    {hasUrl ? (
                      <a
                        href={finalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-md transition-all shadow-sm ${
                          isCurrent
                            ? "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                            : isVerified || isAlternative
                              ? "bg-blue-600 text-white hover:bg-blue-700 border border-blue-600"
                              : "bg-white text-blue-600 border border-blue-300 hover:bg-blue-50"
                        }`}
                        title={
                          isAlternative
                            ? "Open alternative listing"
                            : isVerified
                              ? "Open verified listing"
                              : "Open listing"
                        }
                        aria-label={`Open ${p.title} on ${p.platform}`}
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Checking
                          </>
                        ) : isCurrent ? (
                          <>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="h-3 w-3 mr-1" />
                            Open Listing
                          </>
                        )}
                      </a>
                    ) : (
                      <span className="inline-flex items-center text-xs text-gray-400 px-2.5 py-1.5">
                        <Search className="h-3 w-3 mr-1" />
                        No Link
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
