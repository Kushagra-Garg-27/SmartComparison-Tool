import React, { useRef, Suspense } from "react";
import { NeuralNetworkScene } from "../three/NeuralNetworkScene";
import {
  GlowCard,
  HoloBadge,
  GradientDivider,
  SectionBg,
} from "../ui/Primitives";
import { useStaggerReveal, useTilt } from "../motion/animations";
import { colors } from "../theme/tokens";

interface ComparisonItem {
  platform: string;
  price: string;
  rating: string;
  trust: string;
  color: string;
  advantage?: string;
}

const COMPARISONS: ComparisonItem[] = [
  {
    platform: "Amazon",
    price: "$799.00",
    rating: "4.7★",
    trust: "96%",
    color: "#FF9900",
    advantage: "Fast Shipping",
  },
  {
    platform: "Best Buy",
    price: "$829.99",
    rating: "4.9★",
    trust: "98%",
    color: "#0046BE",
    advantage: "In-Store Pickup",
  },
  {
    platform: "Walmart",
    price: "$789.00",
    rating: "4.5★",
    trust: "91%",
    color: "#0071DC",
    advantage: "Lowest Price",
  },
  {
    platform: "eBay",
    price: "$749.99",
    rating: "4.3★",
    trust: "84%",
    color: "#E53238",
    advantage: "Used Options",
  },
];

const ComparisonCard: React.FC<{ item: ComparisonItem; best?: boolean }> = ({
  item,
  best,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref, 5);

  return (
    <div ref={ref} className="reveal-item">
      <GlowCard glowColor={best ? colors.glowingCyan : item.color}>
        <div className="p-5 relative overflow-hidden">
          {best && (
            <div
              className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-xl"
              style={{
                background: "linear-gradient(135deg, #00FFE0, #00C2FF)",
                color: "#05060F",
              }}
            >
              Best Deal
            </div>
          )}

          {/* Platform header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{
                background: `${item.color}20`,
                border: `1px solid ${item.color}40`,
                color: item.color,
              }}
            >
              {item.platform[0]}
            </div>
            <div>
              <div className="text-sm font-semibold text-[#F0F2FF]">
                {item.platform}
              </div>
              {item.advantage && (
                <div className="text-[10px] text-[#8B8FAE]">
                  {item.advantage}
                </div>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-[#4A4D6A] tracking-wider">
                Price
              </span>
              <span className="text-lg font-bold text-[#00FFE0]">
                {item.price}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-[#4A4D6A] tracking-wider">
                Rating
              </span>
              <span className="text-lg font-bold text-[#FFB800]">
                {item.rating}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-[#4A4D6A] tracking-wider">
                Trust
              </span>
              <span className="text-lg font-bold text-[#7B2FF2]">
                {item.trust}
              </span>
            </div>
          </div>

          {/* Comparison bar */}
          <div
            className="mt-4 h-1.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${parseInt(item.trust)}%`,
                background: `linear-gradient(90deg, ${item.color}, ${colors.glowingCyan})`,
                boxShadow: `0 0 8px ${item.color}40`,
                transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        </div>
      </GlowCard>
    </div>
  );
};

export const ComparisonEngine: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(containerRef);

  return (
    <SectionBg variant="blue">
      <section className="relative py-20 px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <HoloBadge color={colors.neonBlue} className="mb-4">
            Comparison Engine
          </HoloBadge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#F0F2FF] mb-3">
            Cross-Platform{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #00C2FF, #00FFE0)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Analysis
            </span>
          </h2>
          <p className="text-[#8B8FAE] max-w-md mx-auto text-sm">
            Neural network visualization of price, trust, and review data across
            retailers.
          </p>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10 items-center">
          {/* Neural network 3D */}
          <div className="w-full lg:w-2/5 h-[350px]">
            <Suspense fallback={null}>
              <NeuralNetworkScene />
            </Suspense>
          </div>

          {/* Comparison cards */}
          <div
            ref={containerRef}
            className="w-full lg:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {COMPARISONS.map((item, i) => (
              <ComparisonCard key={item.platform} item={item} best={i === 2} />
            ))}
          </div>
        </div>

        <GradientDivider className="mt-20 max-w-3xl mx-auto" />
      </section>
    </SectionBg>
  );
};
