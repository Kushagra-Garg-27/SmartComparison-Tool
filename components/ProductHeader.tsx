import React from "react";
import { Product } from "../types";
import { PriceComparisonBar } from "./PriceComparisonBar";
import { Star, Package, Sparkles } from "lucide-react";

interface ProductHeaderProps {
  product: Product;
  competitors: Product[];
  bestPriceId?: string;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  product,
  competitors,
  bestPriceId,
}) => {
  // Quick price summary
  const allPrices = [product, ...competitors]
    .filter((p) => p.price > 0)
    .map((p) => p.price);
  const lowestPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
  const highestPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;
  const savings =
    product.price > 0 && lowestPrice > 0 ? product.price - lowestPrice : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Top strip */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start space-x-4">
          {/* Product Image */}
          {product.image ? (
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden flex items-center justify-center p-1">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Package className="h-7 w-7 text-white/50" />
            </div>
          )}

          {/* Title & Meta */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-sm font-bold leading-tight truncate pr-2"
              title={product.title}
            >
              {product.title}
            </h2>
            <div className="flex items-center space-x-3 mt-1.5">
              {product.rating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] text-white/70">
                    {product.rating.toFixed(1)}
                    {product.reviewCount > 0 && (
                      <span className="text-white/40">
                        {" "}
                        ({product.reviewCount.toLocaleString()})
                      </span>
                    )}
                  </span>
                </div>
              )}
              <span className="text-[11px] text-white/40">
                on {product.platform}
              </span>
            </div>

            {/* Price range indicator */}
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-lg font-extrabold tracking-tight">
                ${product.price > 0 ? product.price.toFixed(2) : "—"}
              </span>
              {savings > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  Save ${savings.toFixed(0)} elsewhere
                </span>
              )}
              {allPrices.length > 1 && (
                <span className="text-[10px] text-white/40">
                  Range: ${lowestPrice.toFixed(0)}–${highestPrice.toFixed(0)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Store comparison cards */}
      <div className="px-5 pb-4">
        <PriceComparisonBar
          currentProduct={product}
          competitors={competitors}
          bestPriceId={bestPriceId}
        />
      </div>
    </div>
  );
};
