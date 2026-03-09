import React, { useRef, useState } from "react";
import gsap from "gsap";
import {
  GlowCard,
  HoloBadge,
  MagneticButton,
  SectionBg,
} from "../ui/Primitives";
import { useTilt, useStaggerReveal } from "../motion/animations";
import { colors } from "../theme/tokens";

interface AltProduct {
  title: string;
  price: string;
  saving: string;
  rating: string;
  image: string;
  platform: string;
  color: string;
  reason: string;
}

const ALTERNATIVES: AltProduct[] = [
  {
    title: "Samsung Galaxy S24 Ultra",
    price: "$1,199.99",
    saving: "Premium Pick",
    rating: "4.8★",
    image: "📱",
    platform: "Amazon",
    color: "#7B2FF2",
    reason: "Better camera system, S-Pen included",
  },
  {
    title: "Google Pixel 9 Pro",
    price: "$699.00",
    saving: "Save $100",
    rating: "4.7★",
    image: "📱",
    platform: "Google Store",
    color: "#00C2FF",
    reason: "Best AI features, pure Android experience",
  },
  {
    title: "OnePlus 12",
    price: "$549.00",
    saving: "Save $250",
    rating: "4.6★",
    image: "📱",
    platform: "OnePlus",
    color: "#FF2E97",
    reason: "Best value flagship, 100W charging",
  },
  {
    title: "iPhone 16 Pro",
    price: "$999.00",
    saving: "Upgrade",
    rating: "4.9★",
    image: "📱",
    platform: "Apple",
    color: "#00FFE0",
    reason: "Titanium design, 5x optical zoom",
  },
  {
    title: "Nothing Phone 3",
    price: "$449.00",
    saving: "Save $350",
    rating: "4.4★",
    image: "📱",
    platform: "Nothing",
    color: "#FFB800",
    reason: "Unique design, great for the price",
  },
];

const AltCard: React.FC<{ product: AltProduct; index: number }> = ({
  product,
  index,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref, 6);

  return (
    <div
      ref={ref}
      className="reveal-item flex-shrink-0 w-[280px]"
      style={{ transform: `translateZ(${index * -10}px)` }}
    >
      <GlowCard glowColor={product.color}>
        <div className="p-5 flex flex-col gap-3 h-full">
          {/* Image & badge */}
          <div className="flex items-start justify-between">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{
                background: `${product.color}10`,
                border: `1px solid ${product.color}25`,
              }}
            >
              {product.image}
            </div>
            <HoloBadge color={product.color}>{product.saving}</HoloBadge>
          </div>

          {/* Title */}
          <div>
            <h4 className="text-sm font-bold text-[#F0F2FF] leading-snug">
              {product.title}
            </h4>
            <span className="text-[10px] text-[#8B8FAE]">
              {product.platform}
            </span>
          </div>

          {/* Reason */}
          <p className="text-xs text-[#8B8FAE] leading-relaxed flex-1">
            {product.reason}
          </p>

          {/* Price & rating */}
          <div
            className="flex items-end justify-between pt-2"
            style={{ borderTop: `1px solid rgba(255,255,255,0.05)` }}
          >
            <span
              className="text-xl font-extrabold"
              style={{
                background: `linear-gradient(135deg, ${product.color}, ${product.color}AA)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {product.price}
            </span>
            <span className="text-xs text-[#FFB800] font-medium">
              {product.rating}
            </span>
          </div>
        </div>
      </GlowCard>
    </div>
  );
};

export const AlternativesCarousel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useStaggerReveal(containerRef);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -300 : 300;
    gsap.to(scrollRef.current, {
      scrollLeft: scrollRef.current.scrollLeft + amount,
      duration: 0.6,
      ease: "expo.out",
    });
  };

  return (
    <SectionBg variant="green">
      <section className="relative py-20 px-6">
        <div className="text-center mb-12">
          <HoloBadge color="#00FF94" className="mb-4">
            Smart Alternatives
          </HoloBadge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#F0F2FF] mb-3">
            AI-Curated{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #00FF94, #00C2FF)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Alternatives
            </span>
          </h2>
          <p className="text-[#8B8FAE] max-w-md mx-auto text-sm">
            Discover products that match your needs — handpicked by our
            intelligence engine.
          </p>
        </div>

        {/* Carousel container */}
        <div className="relative max-w-6xl mx-auto">
          {/* Navigation arrows */}
          <button
            onClick={() => scroll("left")}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
            style={{
              background: "rgba(12, 14, 28, 0.8)",
              border: "1px solid rgba(123, 47, 242, 0.3)",
              color: "#F0F2FF",
            }}
          >
            ←
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
            style={{
              background: "rgba(12, 14, 28, 0.8)",
              border: "1px solid rgba(123, 47, 242, 0.3)",
              color: "#F0F2FF",
            }}
          >
            →
          </button>

          {/* Scrollable cards */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
            style={{
              scrollBehavior: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              perspective: "1000px",
            }}
          >
            <div ref={containerRef} className="flex gap-5 px-2">
              {ALTERNATIVES.map((product, i) => (
                <AltCard key={product.title} product={product} index={i} />
              ))}
            </div>
          </div>

          {/* Fade edges */}
          <div
            className="absolute top-0 left-0 w-16 h-full pointer-events-none"
            style={{
              background: "linear-gradient(90deg, #05060F, transparent)",
            }}
          />
          <div
            className="absolute top-0 right-0 w-16 h-full pointer-events-none"
            style={{
              background: "linear-gradient(-90deg, #05060F, transparent)",
            }}
          />
        </div>
      </section>
    </SectionBg>
  );
};
