import { motion } from "framer-motion";
import { Star, TrendingDown, Zap, BadgeCheck, Gauge } from "lucide-react";

interface ProductHeroProps {
  name: string;
  category: string;
  imageUrl?: string;
  rating: number;
  reviewCount: string;
  priceRange: string;
  bestPrice: number;
  bestStore: string;
  savings: number;
  dealScore: number;
  observations: number;
  sources: number;
  confidence: number;
}

const ProductHero = ({
  name,
  category,
  imageUrl,
  rating,
  reviewCount,
  priceRange,
  bestPrice,
  bestStore,
  savings,
  dealScore,
  observations,
  sources,
  confidence,
}: ProductHeroProps) => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl gradient-hero p-5 glass"
    >
      {/* Ambient glows */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-accent/15 blur-3xl animate-pulse-glow" />

      <div className="relative flex gap-4">
        {/* Product Image */}
        <motion.div
          className="flex-shrink-0 w-24 h-24 rounded-xl bg-secondary/50 flex items-center justify-center overflow-hidden"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <img src={imageUrl || "/placeholder.svg"} alt={name} className="w-20 h-20 object-contain" />
        </motion.div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{category}</span>
            <BadgeCheck className="w-3.5 h-3.5 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground leading-tight mb-1.5 truncate">
            {name}
          </h1>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? "fill-glow-warning text-glow-warning" : "fill-glow-warning/30 text-glow-warning/30"}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{rating} ({reviewCount})</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {priceRange}
          </div>
        </div>
      </div>

      {/* Best Deal Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative mt-4 rounded-xl bg-accent/10 border border-accent/20 p-3.5 glow-accent"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-foreground tracking-tight">₹{bestPrice.toLocaleString()}</div>
              <div className="text-xs text-accent font-medium">Best deal on {bestStore}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              className="flex items-center gap-1 bg-accent/20 rounded-full px-2.5 py-1"
            >
              <TrendingDown className="w-3 h-3 text-accent" />
              <span className="text-xs font-semibold text-accent">Save ₹{savings.toLocaleString()}</span>
            </motion.div>
          </div>
        </div>

        {/* Deal Score */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-3 pt-3 border-t border-accent/15"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-accent" />
              <span className="text-[11px] text-muted-foreground font-medium">Deal Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dealScore}%` }}
                  transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full gradient-accent"
                />
              </div>
              <span className="text-xs font-bold text-accent">{dealScore}</span>
              <span className="text-[10px] text-accent/70 font-medium">{dealScore >= 85 ? "Excellent" : dealScore >= 70 ? "Good" : "Fair"}</span>
            </div>
          </div>
          {/* Transparency row */}
          <div className="flex items-center justify-between text-[9px] text-muted-foreground/70">
            <span>{observations.toLocaleString()} observations · {sources} sources</span>
            <span>Confidence: {confidence}%</span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ProductHero;
