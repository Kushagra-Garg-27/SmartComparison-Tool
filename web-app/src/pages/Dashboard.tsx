import { motion } from "framer-motion";
import { TrendingDown, Package, Bell, Wallet, ChevronRight, Sparkles, Trophy, Target, Zap, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { watchlistService, dealService, alertService } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorFallback from "@/components/shared/ErrorFallback";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const { data: watchlistItems, isLoading: watchlistLoading, isError: watchlistError, refetch: refetchWatchlist } = useQuery({
    queryKey: queryKeys.watchlist.byUser(user!.id),
    queryFn: () => watchlistService.getByUserId(user!.id, 5),
  });

  const { data: recentDeals, isLoading: dealsLoading, isError: dealsError, refetch: refetchDeals } = useQuery({
    queryKey: queryKeys.deals.recent(3),
    queryFn: () => dealService.getRecent(3),
  });

  const { data: alertCount } = useQuery({
    queryKey: queryKeys.alerts.countByUser(user!.id),
    queryFn: () => alertService.getTriggeredCount(user!.id),
  });

  const totalSavings = profile?.total_savings || 0;
  const productsTracked = profile?.products_tracked || 0;
  const dealsCaptured = profile?.deals_captured || 0;

  // Savings milestones
  const milestones = [
    { amount: 1000, label: "Starter Saver", icon: "🌱" },
    { amount: 5000, label: "Smart Shopper", icon: "🎯" },
    { amount: 15000, label: "Deal Hunter", icon: "🏹" },
    { amount: 50000, label: "Savings Champion", icon: "🏆" },
  ];
  const currentMilestone = milestones.filter(m => totalSavings >= m.amount).pop();
  const nextMilestone = milestones.find(m => totalSavings < m.amount);
  const milestoneProgress = nextMilestone
    ? Math.min((totalSavings / nextMilestone.amount) * 100, 100)
    : 100;

  const stats = [
    { label: "Saved", value: `₹${totalSavings.toLocaleString()}`, icon: Wallet, color: "text-accent" },
    { label: "Tracked", value: productsTracked, icon: Package, color: "text-primary" },
    { label: "Alerts", value: alertCount ?? dealsCaptured, icon: Bell, color: "text-glow-warning" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome, ${profile?.display_name || "User"}`}
        showNotifications
        rightContent={
          <button
            onClick={signOut}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        }
      />

      <div className="max-w-md mx-auto px-3 py-4 space-y-4">
        {/* Savings Milestone */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl gradient-primary p-4 glow-primary"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary-foreground" />
              <span className="text-xs font-bold text-primary-foreground">
                {currentMilestone ? `${currentMilestone.icon} ${currentMilestone.label}` : "🌱 Getting Started"}
              </span>
            </div>
            <span className="text-[10px] text-primary-foreground/70">
              ₹{totalSavings.toLocaleString()} saved
            </span>
          </div>
          {nextMilestone && (
            <>
              <div className="h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden mb-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${milestoneProgress}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="h-full bg-primary-foreground/80 rounded-full"
                />
              </div>
              <p className="text-[10px] text-primary-foreground/60">
                ₹{(nextMilestone.amount - totalSavings).toLocaleString()} to "{nextMilestone.label}" {nextMilestone.icon}
              </p>
            </>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="rounded-xl glass p-3 text-center"
            >
              <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
              <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tracked Products */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl glass p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Tracked Products</h2>
            <button onClick={() => navigate("/watchlist")} className="flex items-center gap-0.5 text-[10px] text-primary">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {watchlistLoading && <LoadingSkeleton lines={3} />}
          {watchlistError && <ErrorFallback message="Failed to load tracked products" onRetry={refetchWatchlist} />}
          {!watchlistLoading && !watchlistError && watchlistItems && watchlistItems.length > 0 ? (
            <div className="space-y-2">
              {watchlistItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-secondary/40"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm">📱</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{item.product_name}</div>
                    <div className="text-[10px] text-muted-foreground">{item.store}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-foreground">₹{item.current_price.toLocaleString()}</div>
                    {item.trend === "down" && (
                      <div className="flex items-center gap-0.5 text-accent">
                        <TrendingDown className="w-2.5 h-2.5" />
                        <span className="text-[10px]">Dropping</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : !watchlistLoading && !watchlistError ? (
            <EmptyState
              title="No products tracked yet"
              action={<button onClick={() => navigate("/search")} className="text-xs text-primary hover:underline">Start tracking →</button>}
            />
          ) : null}
        </motion.div>

        {/* Recommended Deals */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl glass p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Recommended Deals</h2>
            </div>
            <button onClick={() => navigate("/deal-radar")} className="flex items-center gap-0.5 text-[10px] text-primary">
              Radar <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {dealsLoading && <LoadingSkeleton lines={2} />}
          {dealsError && <ErrorFallback message="Failed to load deals" onRetry={refetchDeals} />}
          {!dealsLoading && !dealsError && recentDeals && recentDeals.length > 0 ? (
            <div className="space-y-2">
              {recentDeals.map((deal, i) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-accent/10 border border-accent/20"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-sm">🔥</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{deal.product_name}</div>
                    <div className="text-[10px] text-accent">-{deal.discount_percent}% off</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-accent">₹{deal.deal_price.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground line-through">₹{deal.original_price.toLocaleString()}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : !dealsLoading && !dealsError ? (
            <EmptyState title="No deals available yet" />
          ) : null}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-2"
        >
          <button
            onClick={() => navigate("/deal-radar")}
            className="rounded-xl glass p-3 text-left hover:border-primary/30 transition-colors"
          >
            <Zap className="w-4 h-4 text-glow-warning mb-1" />
            <div className="text-xs font-semibold text-foreground">Deal Radar</div>
            <div className="text-[10px] text-muted-foreground">AI-ranked deals</div>
          </button>
          <button
            onClick={() => navigate("/pricing")}
            className="rounded-xl glass p-3 text-left hover:border-primary/30 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-primary mb-1" />
            <div className="text-xs font-semibold text-foreground">Upgrade to Pro</div>
            <div className="text-[10px] text-muted-foreground">Unlock AI features</div>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
