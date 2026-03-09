import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HeroSection } from "./sections/HeroSection";
import { IntelligencePanel } from "./sections/IntelligencePanel";
import { ComparisonEngine } from "./sections/ComparisonEngine";
import { AIInsightsPanel } from "./sections/AIInsightsPanel";
import { AlternativesCarousel } from "./sections/AlternativesCarousel";
import {
  NoiseOverlay,
  AmbientOrbs,
  GridMesh,
  LightBeams,
} from "./ui/Primitives";

gsap.registerPlugin(ScrollTrigger);

export const SmartCompareApp: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Lenis smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // Connect Lenis to GSAP's ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Setup scroll-triggered parallax for sections
    const sections =
      containerRef.current?.querySelectorAll(".parallax-section");
    sections?.forEach((section) => {
      gsap.fromTo(
        section,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
            end: "top 30%",
            toggleActions: "play none none reverse",
          },
        },
      );
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen"
      style={{
        background: "#05060F",
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      {/* Global atmospheric effects */}
      <GridMesh />
      <AmbientOrbs />
      <LightBeams />
      <NoiseOverlay />

      {/* ─── Sections ─── */}
      <HeroSection />

      <div className="parallax-section">
        <IntelligencePanel />
      </div>

      <div className="parallax-section">
        <ComparisonEngine />
      </div>

      <div className="parallax-section">
        <AIInsightsPanel />
      </div>

      <div className="parallax-section">
        <AlternativesCarousel />
      </div>

      {/* Footer */}
      <footer
        className="relative z-10 py-12 px-6 text-center"
        style={{ borderTop: "1px solid rgba(123, 47, 242, 0.1)" }}
      >
        <div className="max-w-4xl mx-auto">
          <h3
            className="text-xl font-bold mb-2"
            style={{
              background: "linear-gradient(135deg, #7B2FF2, #00C2FF)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SmartCompare AI
          </h3>
          <p className="text-xs text-[#4A4D6A] mb-4">
            The future of intelligent shopping — powered by AI
          </p>
          <div className="flex items-center justify-center gap-6 text-[10px] text-[#4A4D6A] uppercase tracking-wider">
            <span>Privacy</span>
            <span>·</span>
            <span>Terms</span>
            <span>·</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SmartCompareApp;
