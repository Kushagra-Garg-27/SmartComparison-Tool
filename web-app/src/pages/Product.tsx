import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, ExternalLink, ShieldCheck } from "lucide-react";
import {
  productService,
  listingService,
  priceHistoryService,
  affiliateService,
  intelligenceService,
} from "@/services/api";
import type { AnalyticsData, AIRecommendation, ProductListing } from "@/services/api/types";
import { queryKeys } from "@/services/queryKeys";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import ErrorFallback from "@/components/shared/ErrorFallback";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import AIInsightsCard from "@/components/AIInsightsCard";
import BuyDecisionPanel from "@/components/BuyDecisionPanel";
import SellerTrustPanel from "@/components/SellerTrustPanel";

const Product = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.products.detail(id!),
    queryFn: () => productService.getById(id!),
    enabled: !!id,
  });

  const { data: listings } = useQuery({
    queryKey: queryKeys.listings.byProduct(id!),
    queryFn: () => listingService.getByProductId(id!),
    enabled: !!id,
  });

  const { data: priceHistory } = useQuery({
    queryKey: queryKeys.priceHistory.byProduct(id!),
    queryFn: () => priceHistoryService.getByProductId(id!),
    enabled: !!id,
  });

  const { data: analytics } = useQuery({
    queryKey: queryKeys.intelligence.analytics(id!),
    queryFn: () => intelligenceService.getAnalytics(id!),
    enabled: !!id,
  });

  const { data: recommendation } = useQuery({
    queryKey: queryKeys.intelligence.recommendation(id!),
    queryFn: () => intelligenceService.getRecommendation(id!),
    enabled: !!id,
  });

  const trackClick = async (listing: ProductListing) => {
    await affiliateService.trackClick({
      userId: user?.id || null,
      listingId: listing.id,
      productId: id!,
      store: listing.store,
      affiliateNetwork: listing.affiliate_network,
    });
    window.open(listing.affiliate_url || listing.store_url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Loading..." />
        <div className="max-w-md mx-auto px-3 py-4">
          <LoadingSkeleton lines={5} />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Product" />
        <div className="max-w-md mx-auto px-3 py-4">
          <ErrorFallback
            message={isError ? "Failed to load product" : "Product not found"}
            onRetry={isError ? refetch : undefined}
          />
        </div>
      </div>
    );
  }

  const sortedListings = listings ? [...listings].sort((a, b) => a.current_price - b.current_price) : [];
  const bestPrice = sortedListings[0];
  const specs = product.specs as Record<string, string> | null;

  // Map analytics to BuyDecisionPanel format
  const decisionData = recommendation ? {
    decision: (recommendation.recommendation === "BUY" ? "buy" : recommendation.recommendation === "WAIT" ? "wait" : "alternative") as "buy" | "wait" | "alternative",
    confidence: Math.round(recommendation.confidence * 100),
    savingsVsMarket: analytics ? Math.round(analytics.averagePrice - analytics.lowestPrice) : 0,
    reasoning: recommendation.insights,
    dataPoints: priceHistory?.length || 0,
    sources: analytics?.storeRankings?.length || sortedListings.length,
    lastUpdated: "just now",
  } : null;

  // Map recommendation insights to AIInsightsCard format
  const aiInsights = recommendation?.factors?.map((f) => ({
    text: f.factor,
    highlight: f.impact,
    detail: `Weight: ${(f.weight * 100).toFixed(0)}% — Impact: ${f.impact}`,
  })) || [];

  // Map listings to SellerTrustPanel format
  const sellerMetrics = sortedListings.map((l) => ({
    store: l.store,
    authorized: (l.seller_rating ?? 0) >= 4,
    delivery: Math.min(Math.round((l.seller_rating ?? 3) * 20), 100),
    returnPolicy: 80,
    overall: Math.min(Math.round((l.seller_rating ?? 3) * 20), 100),
  }));

  // Map price history to PriceHistoryChart format
  const chartData = priceHistory?.map((p) => ({
    date: new Date(p.recorded_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    price: p.price,
  })) || [];

  const chartInsights = analytics ? [
    { type: "low" as const, label: "Lowest", value: `₹${analytics.lowestPrice.toLocaleString()}` },
    { type: "drop" as const, label: "Trend", value: analytics.trend === "down" ? "Dropping" : analytics.trend === "up" ? "Rising" : "Stable" },
    { type: "buy" as const, label: "Volatility", value: `${analytics.volatility.toFixed(1)}%` },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={product.name} />

      <div className="max-w-md mx-auto px-3 py-4 space-y-4">
        {/* Product hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 text-center"
        >
          <div className="w-24 h-24 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center mb-4 overflow-hidden">
            {product.image_url && product.image_url !== "/placeholder.svg" ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <Package className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <h2 className="text-lg font-bold text-foreground">{product.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            {product.brand && <span className="text-xs text-primary font-medium">{product.brand}</span>}
            {product.category && (
              <span className="text-[10px] bg-secondary/60 px-2 py-0.5 rounded-full text-muted-foreground">
                {product.category}
              </span>
            )}
          </div>
          {bestPrice && (
            <div className="mt-3">
              <span className="text-2xl font-bold text-accent">₹{bestPrice.current_price.toLocaleString()}</span>
              {bestPrice.original_price && bestPrice.original_price > bestPrice.current_price && (
                <span className="text-sm text-muted-foreground line-through ml-2">
                  ₹{bestPrice.original_price.toLocaleString()}
                </span>
              )}
            </div>
          )}
          {analytics && (
            <div className="flex items-center justify-center gap-3 mt-2 text-[11px]">
              <span className={`font-semibold ${analytics.trend === "down" ? "text-accent" : analytics.trend === "up" ? "text-destructive" : "text-muted-foreground"}`}>
                {analytics.trend === "down" ? "📉" : analytics.trend === "up" ? "📈" : "➡️"} {analytics.priceChangePct > 0 ? "+" : ""}{analytics.priceChangePct.toFixed(1)}% (30d)
              </span>
              {analytics.recentDrop && (
                <span className="text-accent font-medium">🔥 Recent Drop</span>
              )}
            </div>
          )}
        </motion.div>

        {/* Buy Decision Panel */}
        {decisionData && <BuyDecisionPanel data={decisionData} />}

        {/* Specs */}
        {specs && Object.keys(specs).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-4"
          >
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Specifications</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(specs).map(([key, value]) => (
                <div key={key} className="bg-secondary/30 rounded-lg px-3 py-2">
                  <span className="text-[10px] text-muted-foreground capitalize">{key}</span>
                  <p className="text-xs font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Store listings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Price Comparison · {sortedListings.length} stores
          </h3>
          <div className="space-y-2">
            {sortedListings.map((listing, i) => {
              const isBest = i === 0;
              const discount = listing.original_price
                ? Math.round(((listing.original_price - listing.current_price) / listing.original_price) * 100)
                : 0;
              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className={`glass rounded-xl p-3.5 ${isBest ? "border-accent/30 glow-accent" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{listing.store}</span>
                        {isBest && (
                          <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">
                            BEST
                          </span>
                        )}
                        {listing.seller_rating && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            {listing.seller_rating}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {listing.seller_name || "Unknown seller"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`text-sm font-bold ${isBest ? "text-accent" : "text-foreground"}`}>
                          ₹{listing.current_price.toLocaleString()}
                        </span>
                        {discount > 0 && (
                          <p className="text-[10px] text-accent font-medium">{discount}% off</p>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => trackClick(listing)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-accent text-xs font-semibold text-accent-foreground"
                      >
                        <ExternalLink className="w-3 h-3 inline mr-1" />
                        Buy
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Price History Chart */}
        {chartData.length > 1 && (
          <PriceHistoryChart data={chartData} insights={chartInsights} />
        )}

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <AIInsightsCard
            insights={aiInsights}
            summary={recommendation?.summary}
          />
        )}

        {/* Seller Trust */}
        {sellerMetrics.length > 0 && (
          <SellerTrustPanel sellers={sellerMetrics} />
        )}
      </div>
    </div>
  );
};

export default Product;
