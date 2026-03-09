import React from "react";
import { motion } from "framer-motion";
import { Product } from "../types";
import { Star, Package, Sparkles, TrendingDown, Zap } from "lucide-react";

interface ProductHeroProps {
  product: Product;
  competitors: Product[];
  bestPriceId?: string;
}

export const ProductHero: React.FC<ProductHeroProps> = ({
  product,
  competitors,
  bestPriceId,
}) => {
  const allProducts = [product, ...competitors].filter((p) => p.price > 0);
  const lowestPrice =
    allProducts.length > 0 ? Math.min(...allProducts.map((p) => p.price)) : 0;
  const highestPrice =
    allProducts.length > 0 ? Math.max(...allProducts.map((p) => p.price)) : 0;
  const savings =
    product.price > 0 && lowestPrice > 0 ? product.price - lowestPrice : 0;
  const bestDealProduct = allProducts.find((p) => p.price === lowestPrice);
  const currencySymbol =
    product.currency === "INR"
      ? "₹"
      : product.currency === "GBP"
        ? "£"
        : product.currency === "EUR"
          ? "€"
          : "$";

  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient" />

      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-purple-500/15 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 px-5 pt-5 pb-4">
        {/* Product image + info */}
        <motion.div
          className="flex items-start space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Product Image with glow */}
          <motion.div
            className="flex-shrink-0 relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl" />
            <div className="relative w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden flex items-center justify-center p-2">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Package className="h-8 w-8 text-white/40" />
              )}
            </div>
          </motion.div>

          {/* Title block */}
          <div className="flex-1 min-w-0">
            <motion.h2
              className="text-base font-bold text-white leading-tight line-clamp-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {product.title}
            </motion.h2>

            {/* Rating */}
            <motion.div
              className="flex items-center space-x-2 mt-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {product.rating > 0 && (
                <div className="flex items-center space-x-1 bg-white/10 rounded-full px-2 py-0.5">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-medium text-white/80">
                    {product.rating.toFixed(1)}
                  </span>
                  {product.reviewCount > 0 && (
                    <span className="text-[10px] text-white/40">
                      ({product.reviewCount.toLocaleString()})
                    </span>
                  )}
                </div>
              )}
              <span className="text-[10px] text-white/30 uppercase tracking-wider">
                {product.platform}
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Price spotlight */}
        <motion.div
          className="mt-4 glass-card p-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-indigo-300/70 font-medium mb-1">
                Best Deal Found
              </p>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-gradient-green">
                  {currencySymbol}
                  {lowestPrice > 0
                    ? lowestPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </span>
                {bestDealProduct && (
                  <span className="text-xs text-white/50">
                    on {bestDealProduct.platform}
                  </span>
                )}
              </div>
            </div>

            {savings > 0 && (
              <motion.div
                className="flex items-center space-x-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-3 py-2"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <TrendingDown className="h-4 w-4 text-emerald-400" />
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-300">
                    Save {currencySymbol}
                    {savings.toFixed(0)}
                  </p>
                  <p className="text-[9px] text-emerald-400/60">
                    vs {product.platform}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Price range bar */}
          {allProducts.length > 1 && highestPrice > lowestPrice && (
            <div className="mt-3">
              <div className="flex justify-between text-[9px] text-white/30 mb-1">
                <span>
                  {currencySymbol}
                  {lowestPrice.toFixed(0)}
                </span>
                <span>
                  {currencySymbol}
                  {highestPrice.toFixed(0)}
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-indigo-400 to-rose-400"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-[9px] text-white/25 mt-1 text-center">
                {allProducts.length} stores compared
              </p>
            </div>
          )}
        </motion.div>

        {/* Quick deal badge */}
        {savings > 0 && bestDealProduct && (
          <motion.div
            className="mt-3 flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 rounded-xl px-3 py-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-[11px] text-white/70">
              <span className="font-semibold text-white">
                {bestDealProduct.platform}
              </span>{" "}
              has the best price — save{" "}
              <span className="font-bold text-emerald-400">
                {currencySymbol}
                {savings.toFixed(0)}
              </span>{" "}
              vs {product.platform}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
