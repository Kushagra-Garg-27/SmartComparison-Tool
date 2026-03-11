import { motion } from "framer-motion";
import { Flame, Clock, TrendingDown, Sparkles, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dealService } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorFallback from "@/components/shared/ErrorFallback";
import { useState } from "react";

type DealCategory = "all" | "electronics" | "fashion" | "home" | "limited";

const Deals = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<DealCategory>("all");

  const { data: deals, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.deals.all,
    queryFn: () => dealService.getAll(),
  });

  const filteredDeals = !deals ? [] :
    category === "all"
      ? deals
      : category === "limited"
        ? deals.filter(d => d.is_limited_time)
        : deals.filter(d => d.category === category);

  const categories: { key: DealCategory; label: string; icon: typeof Flame }[] = [
    { key: "all", label: "All", icon: Sparkles },
    { key: "electronics", label: "Electronics", icon: TrendingDown },
    { key: "fashion", label: "Fashion", icon: Filter },
    { key: "limited", label: "Limited", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Deal Discovery"
        subtitle={`${filteredDeals.length} hot deals today`}
      >
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 mt-3">
          {categories.map((cat) => (
            <motion.button
              key={cat.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                category === cat.key
                  ? "gradient-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label}
            </motion.button>
          ))}
        </div>
      </PageHeader>

      <div className="max-w-md mx-auto px-3 py-4 space-y-2.5">
        {isLoading && <LoadingSkeleton lines={5} />}
        {isError && <ErrorFallback message="Failed to load deals" onRetry={refetch} />}

        {!isLoading && !isError && filteredDeals.map((deal, i) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => deal.product_id && navigate(`/product/${deal.product_id}`)}
            className={`rounded-xl glass p-3.5 cursor-pointer transition-all ${
              deal.is_limited_time ? "border-glow-warning/30 glow-warning" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-secondary/60 flex items-center justify-center text-xl flex-shrink-0">
                {deal.product_image || "🛍️"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {deal.is_limited_time && (
                    <div className="flex items-center gap-0.5 text-glow-warning">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-medium">Limited</span>
                    </div>
                  )}
                  <span className="text-[10px] text-muted-foreground">{deal.store}</span>
                </div>
                <div className="text-xs font-semibold text-foreground truncate">{deal.product_name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-accent">₹{deal.deal_price.toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground line-through">₹{deal.original_price.toLocaleString()}</span>
                  <span className="text-[10px] font-semibold text-accent bg-accent/10 rounded-full px-1.5 py-0.5">
                    -{deal.discount_percent}%
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
                  <span className="text-xs font-bold text-accent-foreground">{deal.deal_score}</span>
                </div>
                <span className="text-[9px] text-muted-foreground">Score</span>
              </div>
            </div>
          </motion.div>
        ))}

        {!isLoading && !isError && filteredDeals.length === 0 && (
          <EmptyState
            icon={<Flame className="w-10 h-10 text-muted-foreground/30" />}
            title="No deals in this category"
            description="Try a different category or check back later"
          />
        )}
      </div>
    </div>
  );
};

export default Deals;
