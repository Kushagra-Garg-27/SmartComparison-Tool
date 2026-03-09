import React from "react";

interface PriceBadgeProps {
  price: number;
  currency?: string;
  isBest?: boolean;
  size?: "sm" | "md" | "lg";
  unavailableText?: string;
}

export const PriceBadge: React.FC<PriceBadgeProps> = ({
  price,
  currency = "USD",
  isBest = false,
  size = "md",
  unavailableText = "Price unavailable",
}) => {
  const symbol =
    currency === "INR"
      ? "₹"
      : currency === "GBP"
        ? "£"
        : currency === "EUR"
          ? "€"
          : "$";

  if (price <= 0) {
    return (
      <span className="text-xs text-gray-400 italic">{unavailableText}</span>
    );
  }

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-lg",
  };

  return (
    <span
      className={`font-bold ${sizeClasses[size]} ${
        isBest ? "text-emerald-600" : "text-gray-900"
      }`}
    >
      {symbol}
      {price.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      {isBest && (
        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-700 align-middle">
          BEST
        </span>
      )}
    </span>
  );
};
