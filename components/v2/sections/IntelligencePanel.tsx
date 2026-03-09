import React, { useRef, Suspense } from "react";
import {
  GlowCard,
  HoloBadge,
  GradientDivider,
  SectionBg,
} from "../ui/Primitives";
import { useStaggerReveal, useTilt } from "../motion/animations";
import { ProductScannerScene } from "../three/ProductScannerScene";
import { colors } from "../theme/tokens";

interface IntelCard {
  icon: string;
  title: string;
  value: string;
  subtext: string;
  color: string;
  badge?: string;
}

const INTEL_CARDS: IntelCard[] = [
  {
    icon: "💰",
    title: "Price Analysis",
    value: "$799.00",
    subtext: "Best price across 6 retailers",
    color: colors.glowingCyan,
    badge: "Best Price",
  },
  {
    icon: "🛡️",
    title: "Seller Trust",
    value: "96%",
    subtext: "Verified authentic seller",
    color: colors.electricPurple,
    badge: "Trusted",
  },
  {
    icon: "🔍",
    title: "Review Authenticity",
    value: "82%",
    subtext: "18% flagged as suspicious",
    color: colors.cyberPink,
    badge: "AI Verified",
  },
  {
    icon: "⚡",
    title: "Better Alternatives",
    value: "3 Found",
    subtext: "Up to 14% cheaper options",
    color: "#00FF94",
    badge: "Savings",
  },
];

const IntelTile: React.FC<{ card: IntelCard }> = ({ card }) => {
  const tileRef = useRef<HTMLDivElement>(null);
  useTilt(tileRef, 6);

  return (
    <div ref={tileRef} className="reveal-item">
      <GlowCard glowColor={card.color}>
        <div className="p-5 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-sm font-medium text-[#8B8FAE]">
                {card.title}
              </span>
            </div>
            {card.badge && (
              <HoloBadge color={card.color}>{card.badge}</HoloBadge>
            )}
          </div>

          {/* Value */}
          <span
            className="text-3xl font-extrabold"
            style={{
              background: `linear-gradient(135deg, ${card.color}, ${card.color}CC)`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: `drop-shadow(0 0 12px ${card.color}30)`,
            }}
          >
            {card.value}
          </span>

          {/* Subtext */}
          <span className="text-xs text-[#8B8FAE]">{card.subtext}</span>

          {/* Animated bar */}
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: `${card.color}15` }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: "78%",
                background: `linear-gradient(90deg, ${card.color}, ${card.color}80)`,
                boxShadow: `0 0 10px ${card.color}40`,
              }}
            />
          </div>
        </div>
      </GlowCard>
    </div>
  );
};

export const IntelligencePanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(containerRef);

  return (
    <SectionBg variant="purple">
      <section className="relative py-20 px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <HoloBadge color={colors.electricPurple} className="mb-4">
            Live Intelligence
          </HoloBadge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#F0F2FF] mb-3">
            Product Intelligence{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #7B2FF2, #00C2FF)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Dashboard
            </span>
          </h2>
          <p className="text-[#8B8FAE] max-w-md mx-auto text-sm">
            Real-time AI analysis of pricing, reviews, and seller reputation
            across the web.
          </p>
        </div>

        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 items-center">
          {/* 3D Scanner */}
          <div className="w-full lg:w-2/5 h-[320px] relative">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center text-[#8B8FAE]">
                  Loading scanner...
                </div>
              }
            >
              <ProductScannerScene scanning />
            </Suspense>
          </div>

          {/* Intel cards grid */}
          <div
            ref={containerRef}
            className="w-full lg:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {INTEL_CARDS.map((card) => (
              <IntelTile key={card.title} card={card} />
            ))}
          </div>
        </div>

        <GradientDivider className="mt-20 max-w-3xl mx-auto" />
      </section>
    </SectionBg>
  );
};
