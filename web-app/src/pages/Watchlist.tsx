import { motion } from "framer-motion";
import { Bell, Eye, TrendingDown, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { watchlistService } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorFallback from "@/components/shared/ErrorFallback";

const Watchlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchlistItems, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.watchlist.byUser(user!.id),
    queryFn: () => watchlistService.getByUserId(user!.id),
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => watchlistService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlist.byUser(user!.id) });
      toast.success("Item removed from watchlist");
    },
    onError: () => {
      toast.error("Failed to remove item");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Watchlist"
        subtitle={`${watchlistItems?.length || 0} products tracked`}
        rightContent={
          <div className="flex items-center gap-1 bg-primary/15 rounded-full px-2 py-0.5">
            <Bell className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-primary font-medium">Alerts On</span>
          </div>
        }
      />

      <div className="max-w-md mx-auto px-3 py-4 space-y-2.5">
        {isLoading && <LoadingSkeleton lines={4} />}
        {isError && <ErrorFallback message="Failed to load watchlist" onRetry={refetch} />}
        {!isLoading && !isError && watchlistItems && watchlistItems.length > 0 ? (
          watchlistItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl glass p-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center text-lg flex-shrink-0">
                  {item.product_image || "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{item.product_name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{item.store}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-foreground">₹{item.current_price.toLocaleString()}</span>
                    <div className="flex items-center gap-0.5">
                      <TrendingDown className={`w-2.5 h-2.5 ${
                        item.trend === "down" ? "text-accent" : 
                        item.trend === "up" ? "text-destructive" : "text-muted-foreground"
                      }`} />
                      <span className={`text-[10px] font-medium ${
                        item.trend === "down" ? "text-accent" : 
                        item.trend === "up" ? "text-destructive" : "text-muted-foreground"
                      }`}>
                        {item.trend === "down" ? "Dropping" : item.trend === "up" ? "Rising" : "Stable"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {item.alert_price && (
                    <div className="text-[10px] text-muted-foreground">
                      Alert: ₹{item.alert_price.toLocaleString()}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <button className="p-1 rounded-md hover:bg-secondary/60 transition-colors">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                    </button>
                    {user && (
                      <button
                        onClick={() => deleteItem.mutate(item.id)}
                        className="p-1 rounded-md hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : !isLoading && !isError ? (
          <EmptyState
            title="No products in your watchlist"
            description="Browse products and add them to track price changes"
            action={
              <button onClick={() => navigate("/search")} className="text-xs text-primary hover:underline">
                Browse products →
              </button>
            }
          />
        ) : null}
      </div>
    </div>
  );
};

export default Watchlist;
