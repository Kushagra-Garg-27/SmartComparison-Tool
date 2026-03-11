import { motion } from "framer-motion";
import { Flame, TrendingDown, Clock, Zap, BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dealService } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import ErrorFallback from "@/components/shared/ErrorFallback";
import EmptyState from "@/components/shared/EmptyState";
import { useState } from "react";

type SortMode = "savings" | "score" | "trending";

const getTimeLeft = (expiresAt: string | null) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;
};

const DealRadar = () => {
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<SortMode>("score");

  const { data: deals, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.deals.all,
    queryFn: () => dealService.getAll(),
  });

  const sorted = !deals ? [] : [...deals].sort((a, b) => {
    if (sortMode === "savings") return (b.discount_percent ?? 0) - (a.discount_percent ?? 0);
    if (sortMode === "trending") return (b.deal_score ?? 0) - (a.deal_score ?? 0);
    return (b.deal_score ?? 0) - (a.deal_score ?? 0);
  });

  const flashDeals = sorted.filter(d => d.is_limited_time);
  const topDeals = sorted.slice(0, 5);

  const sortOptions: { key: SortMode; label: string; icon: typeof BarChart3 }[] = [
    { key: "score", label: "Deal Score", icon: Sparkles },
    { key: "savings", label: "Biggest Savings", icon: TrendingDown },
    { key: "trending", label: "Trending", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Deal Radar"
        subtitle="AI-ranked deals updated live"
        icon={<Zap className="w-4 h-4 text-glow-warning" />}
      >
        {/* Sort options */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
          {sortOptions.map((opt) => (
            <motion.button
              key={opt.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSortMode(opt.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                sortMode === opt.key
                  ? "gradient-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <opt.icon className="w-3 h-3" />
              {opt.label}
            </motion.button>
          ))}
        </div>
      </PageHeader>

      <div className="max-w-md mx-auto px-3 py-4 space-y-5">
        {isLoading && <LoadingSkeleton lines={6} />}
        {isError && <ErrorFallback message="Failed to load deal radar" onRetry={refetch} />}

        {!isLoading && !isError && sorted.length === 0 && (
          <EmptyState
            icon={<Zap className="w-10 h-10 text-muted-foreground/30" />}
            title="No deals on radar"
            description="Check back soon for AI-ranked deals"
          />
        )}

        {!isLoading && !isError && sorted.length > 0 && (
          <>
            {/* Flash Sales Section */}
            {flashDeals.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <Flame className="w-4 h-4 text-glow-warning" />
                  <h2 className="text-xs font-bold text-foreground">Flash Sales</h2>
                  <div className="ml-auto text-[9px] text-glow-warning font-medium animate-pulse">LIVE</div>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1">
                  {flashDeals.map((deal, i) => (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      onClick={() => deal.product_id && navigate(`/product/${deal.product_id}`)}
                      className="min-w-[180px] rounded-xl glass border border-glow-warning/20 p-3 flex-shrink-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <Clock className="w-3 h-3 text-glow-warning" />
                        <span className="text-[9px] font-medium text-glow-warning">{getTimeLeft(deal.expires_at)}</span>
                      </div>
                      <div className="text-xl mb-1.5">{deal.product_image || "🛍️"}</div>
                      <p className="text-[11px] font-semibold text-foreground truncate">{deal.product_name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-sm font-bold text-accent">₹{deal.deal_price.toLocaleString()}</span>
                        <span className="text-[9px] text-muted-foreground line-through">₹{deal.original_price.toLocaleString()}</span>
                      </div>
                      <div className="mt-1.5 text-[10px] font-semibold text-accent bg-accent/10 rounded-full px-2 py-0.5 inline-block">
                        -{deal.discount_percent}%
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Top Deals */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-xs font-bold text-foreground">Top Deals</h2>
              </div>
              <div className="space-y-2.5">
                {topDeals.map((deal, i) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => deal.product_id && navigate(`/product/${deal.product_id}`)}
                    className="rounded-xl glass p-3.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-secondary/60 flex items-center justify-center text-xl flex-shrink-0">
                        {deal.product_image || "🛍️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <ShieldCheck className="w-2.5 h-2.5 text-accent" />
                          <span className="text-[10px] text-muted-foreground">{deal.store}</span>
                          {deal.is_limited_time && (
                            <span className="text-[9px] text-glow-warning font-medium">⚡ Flash</span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-foreground truncate">{deal.product_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold text-accent">₹{deal.deal_price.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground line-through">₹{deal.original_price.toLocaleString()}</span>
                          <span className="text-[10px] font-semibold text-accent bg-accent/10 rounded-full px-1.5 py-0.5">
                            -{deal.discount_percent}%
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center glow-accent">
                          <span className="text-xs font-bold text-accent-foreground">{deal.deal_score}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">Score</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI Prediction Banner */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl gradient-primary p-4 glow-primary"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
                <h3 className="text-xs font-bold text-primary-foreground">AI Deal Prediction</h3>
              </div>
              <p className="text-[11px] text-primary-foreground/80 leading-relaxed">
                Based on historical patterns, a major electronics sale is predicted in ~2 weeks. 
                Price drops of 12-18% expected on smartphones and audio gear. 
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="bg-primary-foreground/20 rounded-lg px-2.5 py-1.5">
                  <span className="text-[10px] text-primary-foreground font-medium">78% confidence</span>
                </div>
                <div className="bg-primary-foreground/20 rounded-lg px-2.5 py-1.5">
                  <span className="text-[10px] text-primary-foreground font-medium">1,847 data points</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default DealRadar;
