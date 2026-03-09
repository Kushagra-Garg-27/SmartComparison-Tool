import React, { useRef, useEffect, Suspense } from "react";
import gsap from "gsap";
import { HeroScene } from "../three/HeroScene";
import { useMouseParallax, usePageEntrance } from "../motion/animations";
import { MagneticButton, HoloBadge } from "../ui/Primitives";
import { colors } from "../theme/tokens";

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useMouseParallax();
  usePageEntrance(containerRef);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: colors.deepSpaceBlack }}
    >
      {/* 3D Background */}
      <Suspense fallback={null}>
        <HeroScene mouse={mouse} />
      </Suspense>

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(123, 47, 242, 0.1) 0%, transparent 60%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">
        {/* Status badge */}
        <div className="hero-badge mb-6">
          <HoloBadge color={colors.glowingCyan}>
            AI-Powered Intelligence Engine
          </HoloBadge>
        </div>

        {/* Main headline */}
        <h1 className="hero-title text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-5">
          <span className="block text-[#F0F2FF]">Shop Smarter With</span>
          <span
            className="block"
            style={{
              background:
                "linear-gradient(135deg, #7B2FF2 0%, #00C2FF 50%, #FF2E97 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 30px rgba(123, 47, 242, 0.3))",
            }}
          >
            AI Intelligence
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle text-lg md:text-xl text-[#8B8FAE] max-w-xl leading-relaxed mb-8">
          Real-time price tracking, fake review detection, and AI-powered deal
          discovery across every major retailer — all in your browser.
        </p>

        {/* CTA buttons */}
        <div className="hero-cta flex items-center gap-4">
          <MagneticButton variant="primary">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Start Scanning
          </MagneticButton>
          <MagneticButton variant="secondary">See How It Works</MagneticButton>
        </div>

        {/* Floating stats bar */}
        <div
          className="hero-badge mt-12 flex items-center gap-8 px-8 py-4 rounded-2xl"
          style={{
            background: "rgba(12, 14, 28, 0.6)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(123, 47, 242, 0.15)",
          }}
        >
          <StatMini label="Products Scanned" value="2.4M+" />
          <div
            className="w-px h-8"
            style={{ background: "rgba(123, 47, 242, 0.2)" }}
          />
          <StatMini label="Deals Found" value="890K+" />
          <div
            className="w-px h-8"
            style={{ background: "rgba(123, 47, 242, 0.2)" }}
          />
          <StatMini label="Money Saved" value="$12M+" />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#8B8FAE]">
          Scroll
        </span>
        <div className="w-5 h-8 rounded-full border border-[rgba(123,47,242,0.3)] flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-[#7B2FF2] animate-bounce" />
        </div>
      </div>
    </section>
  );
};

const StatMini: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col items-center">
    <span className="text-lg font-bold text-[#F0F2FF]">{value}</span>
    <span className="text-[10px] text-[#8B8FAE] uppercase tracking-wider">
      {label}
    </span>
  </div>
);
