import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/layouts/AppLayout";
import { dealService } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorFallback from "@/components/shared/ErrorFallback";
import { Sparkles, TrendingDown, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const { data: topDeals, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.deals.recent(6),
    queryFn: () => dealService.getRecent(6),
  });

  return (
    <AppLayout>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl gradient-primary p-5 glow-primary"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
          <h2 className="text-base font-bold text-primary-foreground">Smart Shopping Starts Here</h2>
        </div>
        <p className="text-xs text-primary-foreground/80 leading-relaxed mb-3">
          Compare prices across stores, get AI-powered deal insights, and never overpay again.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/search")}
          className="bg-primary-foreground/20 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-xl"
        >
          Search Products
        </motion.button>
      </motion.div>

      {/* Top Deals Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-glow-warning" />
            <h2 className="text-sm font-semibold text-foreground">Top Deals</h2>
          </div>
          <button
            onClick={() => navigate("/deal-radar")}
            className="text-[10px] text-primary hover:underline"
          >
            View all →
          </button>
        </div>

        {isLoading && <LoadingSkeleton lines={4} />}
        {isError && <ErrorFallback message="Failed to load deals" onRetry={refetch} />}
        {!isLoading && !isError && (!topDeals || topDeals.length === 0) && (
          <EmptyState
            title="No deals available yet"
            description="Check back soon for the latest deals"
          />
        )}

        {topDeals && topDeals.length > 0 && (
          <div className="space-y-2.5">
            {topDeals.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => deal.product_id && navigate(`/product/${deal.product_id}`)}
                className="rounded-xl glass p-3.5 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-secondary/60 flex items-center justify-center text-xl flex-shrink-0">
                    {deal.product_image || "🛍️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{deal.product_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-accent">₹{deal.deal_price.toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground line-through">₹{deal.original_price.toLocaleString()}</span>
                      <span className="text-[10px] font-semibold text-accent bg-accent/10 rounded-full px-1.5 py-0.5">
                        -{deal.discount_percent}%
                      </span>
                    </div>
                  </div>
                  {deal.deal_score && (
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center glow-accent">
                        <span className="text-xs font-bold text-accent-foreground">{deal.deal_score}</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground">Score</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-2"
      >
        <button
          onClick={() => navigate("/deals")}
          className="rounded-xl glass p-3 text-left hover:border-primary/30 transition-colors"
        >
          <TrendingDown className="w-4 h-4 text-accent mb-1" />
          <div className="text-xs font-semibold text-foreground">Browse Deals</div>
          <div className="text-[10px] text-muted-foreground">Latest discounts</div>
        </button>
        <button
          onClick={() => navigate("/deal-radar")}
          className="rounded-xl glass p-3 text-left hover:border-primary/30 transition-colors"
        >
          <Zap className="w-4 h-4 text-glow-warning mb-1" />
          <div className="text-xs font-semibold text-foreground">Deal Radar</div>
          <div className="text-[10px] text-muted-foreground">AI-ranked deals</div>
        </button>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-4"
      >
        <p className="text-[10px] text-muted-foreground">
          Powered by SmartCompare AI · Prices updated live
        </p>
      </motion.div>
    </AppLayout>
  );
};

export default Index;
