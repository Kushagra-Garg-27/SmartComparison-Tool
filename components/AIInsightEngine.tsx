import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, AnalysisResult } from "../types";
import {
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  ShieldCheck,
  TrendingUp,
  Database,
} from "lucide-react";

interface AIInsightEngineProps {
  currentProduct: Product;
  competitors: Product[];
  analysis: AnalysisResult;
}

type AnalysisStage = "thinking" | "insights" | "complete";

const STAGE_MESSAGES = [
  "Analyzing price patterns…",
  "Comparing seller trust scores…",
  "Evaluating deal quality…",
];

export const AIInsightEngine: React.FC<AIInsightEngineProps> = ({
  currentProduct,
  competitors,
  analysis,
}) => {
  const [stage, setStage] = useState<AnalysisStage>("thinking");
  const [stageIdx, setStageIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const allProducts = [currentProduct, ...competitors];
  const confidence = Math.min(
    98,
    Math.max(
      72,
      80 +
        allProducts.length * 3 +
        (analysis.pros.length + analysis.cons.length) * 2,
    ),
  );

  // Simulate staged thinking → reveal
  useEffect(() => {
    if (stage !== "thinking") return;
    const interval = setInterval(() => {
      setStageIdx((i) => {
        if (i >= STAGE_MESSAGES.length - 1) {
          clearInterval(interval);
          setTimeout(() => setStage("insights"), 400);
          return i;
        }
        return i + 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [stage]);

  useEffect(() => {
    if (stage === "insights") {
      const timer = setTimeout(() => setStage("complete"), 600);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  return (
    <motion.div
      className="ai-engine-card relative overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45 }}
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-radial from-ai-indigo/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-radial from-ai-purple/8 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
          <motion.div
            className="h-7 w-7 rounded-xl bg-gradient-to-br from-ai-indigo to-ai-purple flex items-center justify-center ai-breathe"
            animate={stage === "thinking" ? { rotate: [0, 8, -8, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[13px] font-bold text-white/90 tracking-tight">
              AI Analysis
            </h2>
            <AnimatePresence mode="wait">
              {stage === "thinking" ? (
                <motion.p
                  key={stageIdx}
                  className="text-[9px] text-ai-indigo/70"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {STAGE_MESSAGES[stageIdx]}
                </motion.p>
              ) : (
                <motion.p
                  key="done"
                  className="text-[9px] text-deal/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Analysis complete
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          {stage === "thinking" && (
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-ai-indigo"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thinking progress bar */}
        <AnimatePresence>
          {stage === "thinking" && (
            <motion.div
              className="mx-4 h-0.5 rounded-full bg-white/[0.04] overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-ai-indigo via-ai-purple to-ai-blue"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.1, ease: "easeInOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content — revealed after thinking */}
        <AnimatePresence>
          {stage !== "thinking" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="px-4 pb-4"
            >
              {/* Confidence + Source Tags */}
              <motion.div
                className="mt-3 flex flex-wrap items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <div className="flex items-center gap-1.5 bg-deal/[0.07] border border-deal/15 rounded-full px-2.5 py-1">
                  <ShieldCheck className="w-3 h-3 text-deal" />
                  <span className="text-[10px] font-bold text-deal">
                    {confidence}% confidence
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-white/25">
                  <Database className="w-2.5 h-2.5" />
                  <span>Price data</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-white/25">
                  <TrendingUp className="w-2.5 h-2.5" />
                  <span>Market trends</span>
                </div>
              </motion.div>

              {/* Summary block */}
              <motion.div
                className="mt-3 bg-white/[0.025] rounded-xl p-3 border border-white/[0.05]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-ai-indigo mt-0.5 flex-shrink-0" />
                  <p className="text-[12px] text-white/70 leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>
              </motion.div>

              {/* Recommendation badge */}
              {analysis.recommendation && (
                <motion.div
                  className="mt-2.5 flex items-center gap-2 bg-ai-indigo/[0.06] rounded-lg px-3 py-2 border border-ai-indigo/10"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <ArrowRight className="w-3 h-3 text-ai-indigo flex-shrink-0" />
                  <p className="text-[11px] text-ai-indigo/90 font-medium">
                    {analysis.recommendation}
                  </p>
                </motion.div>
              )}

              {/* Pros / Cons as compact chips */}
              <div className="mt-3 space-y-1.5">
                {analysis.pros
                  .slice(0, expanded ? analysis.pros.length : 2)
                  .map((pro, i) => (
                    <motion.div
                      key={`pro-${i}`}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.08 }}
                    >
                      <CheckCircle2 className="w-3 h-3 text-deal mt-0.5 flex-shrink-0" />
                      <span className="text-[11px] text-deal/80 leading-relaxed">
                        {pro}
                      </span>
                    </motion.div>
                  ))}
                {analysis.cons
                  .slice(0, expanded ? analysis.cons.length : 1)
                  .map((con, i) => (
                    <motion.div
                      key={`con-${i}`}
                      className="flex items-start gap-2"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                    >
                      <AlertCircle className="w-3 h-3 text-warning mt-0.5 flex-shrink-0" />
                      <span className="text-[11px] text-warning/80 leading-relaxed">
                        {con}
                      </span>
                    </motion.div>
                  ))}
              </div>

              {/* Expand toggle */}
              {(analysis.pros.length > 2 || analysis.cons.length > 1) && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 mt-2.5 text-[10px] font-medium text-white/30 hover:text-white/50 transition-colors"
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                  />
                  {expanded ? "Show less" : "Show all insights"}
                </button>
              )}

              {/* Alternatives */}
              {analysis.alternatives && analysis.alternatives.length > 0 && (
                <motion.div
                  className="mt-3 pt-3 border-t border-white/[0.04]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-[9px] font-semibold text-white/25 uppercase tracking-widest mb-2">
                    Also consider
                  </p>
                  <div className="space-y-1.5">
                    {analysis.alternatives.slice(0, 2).map((alt, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-white/[0.02] rounded-lg px-2.5 py-1.5 border border-white/[0.04]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-white/55 truncate">
                            {alt.title}
                          </p>
                          <p className="text-[9px] text-white/20">
                            {alt.reason}
                          </p>
                        </div>
                        <span className="text-[12px] font-bold text-ai-blue ml-2">
                          ${alt.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
