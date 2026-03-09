import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import {
  GlowCard,
  HoloBadge,
  GradientDivider,
  SectionBg,
} from "../ui/Primitives";
import { useStaggerReveal, useTypewriter } from "../motion/animations";
import { colors } from "../theme/tokens";

interface Insight {
  icon: string;
  text: string;
  type: "deal" | "warning" | "info" | "success";
}

const INSIGHTS: Insight[] = [
  {
    icon: "💰",
    text: "AI detected a 14% cheaper seller on Walmart — $749.99 vs $799.00",
    type: "deal",
  },
  {
    icon: "🔍",
    text: "Review authenticity score: 82% — 18% flagged as potentially fake",
    type: "warning",
  },
  {
    icon: "📉",
    text: "Price dropped 6% in the last 7 days — historical low approaching",
    type: "info",
  },
  {
    icon: "⚡",
    text: "Flash deal detected: Best Buy offering $50 gift card with purchase",
    type: "success",
  },
  {
    icon: "🛡️",
    text: "All top 3 sellers verified as authorized Apple resellers",
    type: "success",
  },
];

const typeColorMap: Record<string, string> = {
  deal: colors.glowingCyan,
  warning: "#FFB800",
  info: colors.neonBlue,
  success: "#00FF94",
};

const InsightRow: React.FC<{ insight: Insight; active: boolean }> = ({
  insight,
  active,
}) => {
  const displayed = useTypewriter(active ? insight.text : "", 20);
  const lineColor = typeColorMap[insight.type];

  return (
    <div
      className="reveal-item flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-500"
      style={{
        background: active ? `${lineColor}08` : "transparent",
        borderLeft: `2px solid ${active ? lineColor : "rgba(75, 85, 99, 0.2)"}`,
      }}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{insight.icon}</span>
      <div className="flex-1">
        <span
          className="text-sm leading-relaxed"
          style={{ color: active ? "#F0F2FF" : "#4A4D6A" }}
        >
          {active ? displayed : insight.text}
          {active && (
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse" />
          )}
        </span>
      </div>
      {active && (
        <span
          className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            background: `${lineColor}15`,
            color: lineColor,
            border: `1px solid ${lineColor}30`,
          }}
        >
          Live
        </span>
      )}
    </div>
  );
};

export const AIInsightsPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  useStaggerReveal(containerRef);

  // Cycle through insights
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % INSIGHTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SectionBg variant="pink">
      <section className="relative py-20 px-6">
        <div className="text-center mb-12">
          <HoloBadge color={colors.cyberPink} className="mb-4">
            AI Insights
          </HoloBadge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#F0F2FF] mb-3">
            Real-Time{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FF2E97, #FFB800)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AI Discoveries
            </span>
          </h2>
          <p className="text-[#8B8FAE] max-w-md mx-auto text-sm">
            Watch as our AI continuously analyzes and surfaces actionable
            intelligence.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <GlowCard glowColor={colors.cyberPink}>
            <div className="p-6">
              {/* Terminal-style header */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF3366]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00FF94]" />
                </div>
                <span className="text-[10px] text-[#4A4D6A] font-mono ml-2">
                  smartcompare-ai — insights-engine v2.4
                </span>
              </div>

              {/* Insights list */}
              <div ref={containerRef} className="flex flex-col gap-2">
                {INSIGHTS.map((insight, i) => (
                  <InsightRow
                    key={i}
                    insight={insight}
                    active={i === activeIndex}
                  />
                ))}
              </div>

              {/* Footer */}
              <div
                className="mt-5 pt-4 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(123, 47, 242, 0.1)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00FF94] animate-pulse" />
                  <span className="text-[10px] text-[#8B8FAE] font-mono">
                    Engine active — scanning 6 retailers
                  </span>
                </div>
                <span className="text-[10px] text-[#4A4D6A] font-mono">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </GlowCard>
        </div>

        <GradientDivider className="mt-20 max-w-3xl mx-auto" />
      </section>
    </SectionBg>
  );
};
