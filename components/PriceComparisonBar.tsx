import React from "react";
import { Product } from "../types";
import { StoreCard } from "./StoreCard";

interface PriceComparisonBarProps {
  currentProduct: Product;
  competitors: Product[];
  bestPriceId?: string;
}

export const PriceComparisonBar: React.FC<PriceComparisonBarProps> = ({
  currentProduct,
  competitors,
  bestPriceId,
}) => {
  const validCompetitors = competitors.filter(
    (c) => c.verificationStatus !== "failed",
  );
  const allProducts = [currentProduct, ...validCompetitors];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {allProducts.map((p) => (
        <StoreCard
          key={p.id}
          product={p}
          isBestPrice={p.id === bestPriceId}
          isCurrent={p.id === currentProduct.id}
          compact
        />
      ))}
    </div>
  );
};
