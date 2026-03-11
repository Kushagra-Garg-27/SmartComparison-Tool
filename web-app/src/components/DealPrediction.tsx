import { motion } from "framer-motion";
import { Sparkles, TrendingDown, Clock, Target, BarChart3 } from "lucide-react";

interface PredictionData {
  product: string;
  dropProbability: number;
  expectedDrop: number;
  bestBuyWindow: string;
  confidence: number;
  reasoning: string;
}

interface DealPredictionProps {
  prediction: PredictionData;
}

const DealPrediction = ({ prediction }: DealPredictionProps) => {
  const isGoodToBuy = prediction.dropProbability < 40;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.5 }}
      className="rounded-2xl glass p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-glow-warning/20 flex items-center justify-center">
          <Target className="w-3.5 h-3.5 text-glow-warning" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">AI Price Prediction</h2>
          <p className="text-[10px] text-muted-foreground">Powered by historical analysis</p>
        </div>
      </div>

      {/* Prediction Card */}
      <div className={`rounded-xl p-3 mb-3 ${isGoodToBuy ? "bg-accent/10 border border-accent/20" : "bg-glow-warning/10 border border-glow-warning/20"}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-glow-warning" />
            <span className="text-[11px] font-semibold text-foreground">{prediction.bestBuyWindow}</span>
          </div>
          <div className="flex items-center gap-1 bg-secondary/60 rounded-full px-2 py-0.5">
            <Sparkles className="w-2.5 h-2.5 text-primary" />
            <span className="text-[9px] text-primary font-medium">{prediction.confidence}% confident</span>
          </div>
        </div>
        <p className="text-xs text-foreground leading-relaxed">
          Expected price drop of <span className="font-bold text-accent">₹{prediction.expectedDrop.toLocaleString()}</span> within the next 2 weeks.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-secondary/40 p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="w-3 h-3 text-accent" />
            <span className="text-[10px] text-muted-foreground">Drop Probability</span>
          </div>
          <div className="text-sm font-bold text-accent">{prediction.dropProbability}%</div>
          <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${prediction.dropProbability}%` }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="h-full bg-accent rounded-full"
            />
          </div>
        </div>
        <div className="rounded-lg bg-secondary/40 p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <BarChart3 className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-muted-foreground">Data Points</span>
          </div>
          <div className="text-sm font-bold text-primary">1,247</div>
          <p className="text-[9px] text-muted-foreground mt-0.5">90-day analysis</p>
        </div>
      </div>

      {/* Reasoning */}
      <div className="rounded-lg bg-secondary/30 p-2.5">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          💡 {prediction.reasoning}
        </p>
      </div>
    </motion.div>
  );
};

export default DealPrediction;
