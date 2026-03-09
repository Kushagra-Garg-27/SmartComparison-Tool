import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, Review, AnalysisResult, PricePoint } from "../types";
import {
  Sparkles,
  Loader2,
  X,
  BarChart3,
  ShoppingBag,
  Brain,
  MessageSquare,
  Shield,
} from "lucide-react";
import { HeroIntelligence } from "./HeroIntelligence";
import { DealRadar } from "./DealRadar";
import { StoreCards } from "./StoreCards";
import { PriceHistoryGraph } from "./PriceHistoryGraph";
import { AIInsightEngine } from "./AIInsightEngine";
import { AIForecast } from "./AIForecast";
import { SellerTrustRadar } from "./SellerTrustRadar";
import { SmartChat } from "./SmartChat";
import { PriceHistoryService } from "../services/priceHistoryService";

interface SmartOverlayProps {
  currentProduct: Product;
  competitors: Product[];
  reviews: Review[];
  analysis: AnalysisResult | null;
  loading: boolean;
  onRefreshPrices: () => void;
  isRefreshingPrices: boolean;
  lastUpdated: Date;
}

type TabId = "compare" | "insights" | "history" | "ai";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "compare",
    label: "Compare",
    icon: <ShoppingBag className="w-3.5 h-3.5" />,
  },
  {
    id: "insights",
    label: "Insights",
    icon: <Brain className="w-3.5 h-3.5" />,
  },
  {
    id: "history",
    label: "History",
    icon: <BarChart3 className="w-3.5 h-3.5" />,
  },
  { id: "ai", label: "AI", icon: <MessageSquare className="w-3.5 h-3.5" /> },
];

/** SVG Logo for SmartCompare AI */
const SmartCompareLogo: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="50%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      <filter id="logoGlow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#logoGrad)" opacity="0.15" />
    <rect
      x="1"
      y="1"
      width="30"
      height="30"
      rx="7"
      stroke="url(#logoGrad)"
      strokeWidth="0.5"
      fill="none"
      opacity="0.4"
    />
    <path
      d="M16 6L18.5 13L25 13L19.75 17.5L21.5 25L16 20.5L10.5 25L12.25 17.5L7 13L13.5 13Z"
      fill="url(#logoGrad)"
      filter="url(#logoGlow)"
      opacity="0.9"
    />
    <path
      d="M8 22L12 19L16 21L20 16L24 18"
      stroke="#38BDF8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.7"
    />
  </svg>
);

export const SmartOverlay: React.FC<SmartOverlayProps> = ({
  currentProduct,
  competitors,
  reviews,
  analysis,
  loading,
  onRefreshPrices,
  isRefreshingPrices,
  lastUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("compare");
  const historyData: PricePoint[] = PriceHistoryService.getHistory(
    currentProduct.id,
  );

  // ── Loading state ──
  if (loading) {
    return (
      <div className="relative h-screen w-full bg-space flex flex-col noise-overlay">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <SmartCompareLogo size={28} />
            <span className="text-sm font-bold text-white tracking-tight font-display">
              SmartCompare<span className="text-gradient-ai"> AI</span>
            </span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center space-y-5">
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-ai-indigo/15 to-ai-purple/15 border border-ai-indigo/15 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-ai-indigo/60 animate-pulse" />
            </div>
            <Loader2 className="absolute -top-1 -right-1 h-5 w-5 text-ai-indigo animate-spin" />
            <div className="absolute inset-0 bg-ai-indigo/15 rounded-3xl blur-2xl" />
          </motion.div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white/80 font-display">
              Analyzing market data…
            </p>
            <p className="text-xs text-white/25 mt-1">
              Comparing prices across stores
            </p>
          </div>
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-ai-indigo via-ai-purple to-ai-blue rounded-full"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ width: "40%" }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── No analysis available ──
  if (!analysis) {
    return (
      <div className="relative h-screen w-full bg-space flex flex-col noise-overlay">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <SmartCompareLogo size={28} />
            <span className="text-sm font-bold text-white tracking-tight font-display">
              SmartCompare<span className="text-gradient-ai"> AI</span>
            </span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="h-14 w-14 rounded-2xl bg-risk/8 border border-risk/15 flex items-center justify-center mx-auto mb-3">
              <X className="h-6 w-6 text-risk/60" />
            </div>
            <p className="text-sm font-semibold text-white/60 font-display">
              Analysis unavailable
            </p>
            <p className="text-xs text-white/25 mt-1">
              Visit a product page to compare prices
            </p>
          </div>
        </div>
      </div>
    );
  }

  const allProducts = [currentProduct, ...competitors];

  // ── Main panel layout — AI Command Center ──
  return (
    <div className="relative h-screen w-full bg-space flex flex-col noise-overlay">
      {/* ─── Top bar ─── */}
      <div className="relative flex items-center justify-between px-4 py-2 flex-shrink-0 z-20">
        <div className="absolute inset-0 bg-space/80 backdrop-blur-xl" />
        <div className="absolute bottom-0 left-0 right-0 neon-line" />
        <div className="relative flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <SmartCompareLogo size={24} />
          </motion.div>
          <span className="text-[13px] font-bold text-white tracking-tight font-display">
            SmartCompare<span className="text-gradient-ai"> AI</span>
          </span>
        </div>
        <div className="relative flex items-center gap-1.5 text-[9px] text-white/20">
          <span className="h-1.5 w-1.5 rounded-full bg-deal animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* ─── Scrollable content — AI Command Center ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {/* Section 1: Hero Intelligence — always visible */}
        <HeroIntelligence
          product={currentProduct}
          competitors={competitors}
          bestPriceId={analysis.bestPriceId}
        />

        {/* ─── Premium Tab Navigation ─── */}
        <div className="sticky top-0 z-30 flex-shrink-0">
          <div className="relative px-3 pt-2 pb-0 bg-space/90 backdrop-blur-xl">
            <div className="flex items-center gap-0.5 relative">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="nav-tab-v2 group"
                  >
                    <span
                      className={`nav-tab-icon ${isActive ? "nav-tab-icon-active" : "nav-tab-icon-inactive"}`}
                    >
                      {tab.icon}
                    </span>
                    <span
                      className={`text-[11px] font-semibold transition-colors duration-200 ${isActive ? "text-white" : "text-white/30 group-hover:text-white/55"}`}
                    >
                      {tab.label}
                    </span>
                    {isActive && (
                      <motion.div
                        className="nav-tab-underline"
                        layoutId="activeTabUnderline"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 35,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-0 neon-line opacity-30" />
          </div>
        </div>

        {/* ─── Tab Content ─── */}
        <div className="flex-1 p-3">
          <AnimatePresence mode="wait">
            {activeTab === "compare" && (
              <motion.div
                key="compare"
                className="space-y-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <StoreCards
                  currentProduct={currentProduct}
                  competitors={competitors}
                  bestPriceId={analysis.bestPriceId}
                  bestValueId={analysis.bestValueId}
                  trustWarningId={analysis.trustWarningId}
                  onRefreshPrices={onRefreshPrices}
                  isRefreshingPrices={isRefreshingPrices}
                  lastUpdated={lastUpdated}
                />
              </motion.div>
            )}

            {activeTab === "insights" && (
              <motion.div
                key="insights"
                className="space-y-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <DealRadar
                  product={currentProduct}
                  competitors={competitors}
                  bestPriceId={analysis.bestPriceId}
                />
                <AIForecast
                  currentProduct={currentProduct}
                  competitors={competitors}
                />
                <SellerTrustRadar products={allProducts} />
                <AIInsightEngine
                  currentProduct={currentProduct}
                  competitors={competitors}
                  analysis={analysis}
                />
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                key="history"
                className="space-y-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <PriceHistoryGraph
                  data={historyData}
                  productTitle={currentProduct.title}
                />
              </motion.div>
            )}

            {activeTab === "ai" && (
              <motion.div
                key="ai"
                className="space-y-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <SmartChat
                  currentProduct={currentProduct}
                  competitors={competitors}
                  analysis={analysis}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="relative flex-shrink-0 z-20">
        <div className="absolute inset-0 bg-space/80 backdrop-blur-xl" />
        <div className="absolute top-0 left-0 right-0 neon-line" />
        <div className="relative px-4 py-1.5 flex items-center justify-between">
          <span className="text-[9px] text-white/20">
            Powered by{" "}
            <span className="font-semibold text-gradient-ai">Gemini</span> •
            SmartCompare AI
          </span>
          <span className="text-[9px] text-white/15">
            {competitors.length} stores compared
          </span>
        </div>
      </div>
    </div>
  );
};
