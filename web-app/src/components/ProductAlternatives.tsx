import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Star, TrendingDown, Cpu, Camera, Battery } from "lucide-react";

interface Alternative {
  name: string;
  price: number;
  rating: number;
  reviews: string;
  highlight: string;
  highlightIcon: typeof Camera;
  savings: number;
  image: string;
}

interface ProductAlternativesProps {
  alternatives: Alternative[];
}

const ProductAlternatives = ({ alternatives }: ProductAlternativesProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="rounded-2xl glass p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">AI Alternatives</h2>
        </div>
        <span className="text-[10px] text-muted-foreground bg-secondary/60 rounded-full px-2 py-0.5">
          {alternatives.length} found
        </span>
      </div>

      <div className="space-y-2.5">
        {alternatives.map((alt, i) => (
          <motion.div
            key={alt.name}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + i * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -1 }}
            className="rounded-xl glass p-3 cursor-pointer transition-all duration-300 hover:border-primary/30 group"
          >
            <div className="flex items-center gap-3">
              {/* Product emoji/image */}
              <div className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center text-lg flex-shrink-0">
                {alt.image}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{alt.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-glow-warning text-glow-warning" />
                    <span className="text-[10px] text-muted-foreground">{alt.rating}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">({alt.reviews})</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <alt.highlightIcon className="w-2.5 h-2.5 text-primary" />
                  <span className="text-[10px] text-primary font-medium">{alt.highlight}</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-foreground">₹{alt.price.toLocaleString()}</div>
                <div className="flex items-center gap-0.5 justify-end">
                  <TrendingDown className="w-2.5 h-2.5 text-accent" />
                  <span className="text-[10px] font-semibold text-accent">-₹{alt.savings.toLocaleString()}</span>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProductAlternatives;
