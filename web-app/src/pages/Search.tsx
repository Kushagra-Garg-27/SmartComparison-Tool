import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, SlidersHorizontal, Package, Tag, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/api";
import { queryKeys } from "@/services/queryKeys";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorFallback from "@/components/shared/ErrorFallback";

const categoryFilters = ["all", "electronics", "fashion", "home"] as const;

const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const { data: results, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.products.search(query, category),
    queryFn: async () => {
      if (query.length < 2) {
        return productService.getAll(category, 20);
      }
      return productService.search(query, category);
    },
    enabled: true,
  });

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Search" subtitle="Find the best deals">
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, categories..."
              autoFocus
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-secondary/60 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3">
          {categoryFilters.map((cat) => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground"
              }`}
            >
              {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </motion.button>
          ))}
        </div>
      </PageHeader>

      {/* Results */}
      <div className="max-w-md mx-auto px-3 py-4">
        {isLoading ? (
          <LoadingSkeleton lines={5} />
        ) : isError ? (
          <ErrorFallback message="Search failed" onRetry={refetch} />
        ) : results && results.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            <AnimatePresence>
              {results.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="glass rounded-xl p-3.5 cursor-pointer hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden">
                      {product.image_url && product.image_url !== "/placeholder.svg" ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                      ) : (
                        <Package className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground truncate">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {product.brand && (
                          <span className="text-[11px] text-primary font-medium">{product.brand}</span>
                        )}
                        {product.category && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Tag className="w-2.5 h-2.5" />
                            {product.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState
            icon={<SearchIcon className="w-10 h-10 text-muted-foreground/30" />}
            title={query.length < 2 ? "Start typing to search products" : "No products found"}
          />
        )}
      </div>
    </div>
  );
};

export default Search;
