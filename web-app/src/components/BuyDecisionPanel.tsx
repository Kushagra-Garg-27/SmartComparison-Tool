import { motion } from "framer-motion";
import { ShoppingCart, Clock, ArrowRight, Shield, TrendingDown, BarChart3, Eye } from "lucide-react";

type Decision = "buy" | "wait" | "alternative";

interface DecisionData {
  decision: Decision;
  confidence: number;
  savingsVsMarket: number;
  reasoning: string[];
  dataPoints: number;
  sources: number;
  lastUpdated: string;
}

interface BuyDecisionPanelProps {
  data: DecisionData;
}


const decisionConfig: Record<Decision, { label: string; icon: typeof ShoppingCart; color: string; bg: string; glow: string }> = {
  buy: { label: "Buy Now", icon: ShoppingCart, color: "text-accent", bg: "bg-accent/10 border-accent/25", glow: "glow-accent" },
  wait: { label: "Wait", icon: Clock, color: "text-glow-warning", bg: "bg-glow-warning/10 border-glow-warning/25", glow: "glow-warning" },
  alternative: { label: "Consider Alternative", icon: ArrowRight, color: "text-primary", bg: "bg-primary/10 border-primary/25", glow: "glow-primary" },
};

const BuyDecisionPanel = ({ data }: BuyDecisionPanelProps) => {
  const config = decisionConfig[data.decision];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="rounded-2xl glass p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Buy Decision</h2>
      </div>

      {/* Decision Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className={`rounded-xl border p-4 ${config.bg} ${config.glow}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-lg gradient-accent flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <div className={`text-lg font-extrabold ${config.color}`}>{config.label}</div>
              <div className="text-[11px] text-muted-foreground">AI Recommendation</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black ${config.color}`}>{data.confidence}%</div>
            <div className="text-[10px] text-muted-foreground">Confidence</div>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.confidence}%` }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full gradient-accent"
          />
        </div>

        {/* Savings */}
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingDown className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-semibold text-accent">
            Save ₹{data.savingsVsMarket.toLocaleString()} vs market average
          </span>
        </div>

        {/* Reasoning */}
        <div className="space-y-1.5">
          {data.reasoning.map((reason, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-start gap-2"
            >
              <div className="w-1 h-1 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground leading-relaxed">{reason}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Transparency Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{data.dataPoints.toLocaleString()} data points</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{data.sources} sources</span>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">Updated {data.lastUpdated}</span>
      </div>
    </motion.div>
  );
};

export default BuyDecisionPanel;
