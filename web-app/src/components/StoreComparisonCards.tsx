import { motion } from "framer-motion";
import { ExternalLink, Shield, ShieldCheck, ShieldAlert, Crown, Truck, RotateCcw } from "lucide-react";
import logoFlipkart from "@/assets/logo-flipkart.png";
import logoAmazon from "@/assets/logo-amazon.png";
import logoCroma from "@/assets/logo-croma.png";
import logoTataCliq from "@/assets/logo-tata-cliq.png";

interface Store {
  name: string;
  price: number;
  trustScore: number;
  sellerType: string;
  isBestDeal: boolean;
  trustLevel: "high" | "medium" | "low";
  delivery: number;
  returns: number;
  link: string;
}

interface StoreComparisonCardsProps {
  stores: Store[];
}

const logoMap: { [key: string]: string } = {
  Flipkart: logoFlipkart,
  Amazon: logoAmazon,
  Croma: logoCroma,
  "Tata Cliq": logoTataCliq,
};

const trustConfig = {
  high: { icon: ShieldCheck, color: "text-accent", border: "border-accent/20" },
  medium: { icon: Shield, color: "text-primary", border: "border-primary/20" },
  low: { icon: ShieldAlert, color: "text-glow-warning", border: "border-glow-warning/20" },
};

const StoreComparisonCards = ({ stores }: StoreComparisonCardsProps) => {
  const maxPrice = Math.max(...stores.map((s) => s.price));
  const minPrice = Math.min(...stores.map((s) => s.price));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Price Comparison</h2>
        <span className="text-xs text-muted-foreground">{stores.length} stores</span>
      </div>
      <div className="space-y-2.5">
        {stores.map((store, index) => {
          const trust = trustConfig[store.trustLevel];
          const TrustIcon = trust.icon;
          return (
            <motion.div
              key={store.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`relative rounded-xl glass p-3.5 cursor-pointer transition-all duration-300 hover:border-primary/30 ${
                store.isBestDeal ? "border-accent/30 glow-accent" : ""
              }`}
            >
              {store.isBestDeal && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="absolute -top-2 -right-1 flex items-center gap-1 gradient-accent rounded-full px-2 py-0.5"
                >
                  <Crown className="w-2.5 h-2.5 text-accent-foreground" />
                  <span className="text-[10px] font-bold text-accent-foreground">BEST</span>
                </motion.div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <img
                     src={logoMap[store.name]}
                     alt={store.name}
                     className="w-9 h-9 rounded-lg object-contain bg-secondary/50 p-1"
                   />
                   <div>
                     <div className="text-sm font-semibold text-foreground">{store.name}</div>
                     <div className="flex items-center gap-1.5 mt-0.5">
                      <TrustIcon className={`w-3 h-3 ${trust.color}`} />
                      <span className="text-[11px] text-muted-foreground">{store.sellerType}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                   <div>
                     <div className={`text-sm font-bold ${store.isBestDeal ? "text-accent" : "text-foreground"}`}>
                       ₹{store.price.toLocaleString()}
                     </div>
                     <div className="text-[11px] text-muted-foreground">Trust {store.trustScore}%</div>
                   </div>
                   <motion.a
                     href={store.link}
                     target="_blank"
                     rel="noopener noreferrer"
                     whileHover={{ scale: 1.05 }}
                     className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-accent text-xs font-semibold text-accent-foreground hover:shadow-lg hover:shadow-primary/30 transition-all"
                   >
                     Buy Now
                   </motion.a>
                 </div>
              </div>

              {/* Compact trust bars */}
              <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border/30">
                <div className="flex items-center gap-1.5 flex-1">
                  <Truck className="w-2.5 h-2.5 text-muted-foreground" />
                  <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${store.delivery}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      className={`h-full rounded-full ${store.delivery >= 90 ? "bg-accent" : store.delivery >= 75 ? "bg-primary" : "bg-glow-warning"}`}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{store.delivery}%</span>
                </div>
                <div className="flex items-center gap-1.5 flex-1">
                  <RotateCcw className="w-2.5 h-2.5 text-muted-foreground" />
                  <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${store.returns}%` }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                      className={`h-full rounded-full ${store.returns >= 90 ? "bg-accent" : store.returns >= 75 ? "bg-primary" : "bg-glow-warning"}`}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{store.returns}%</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Price Bar Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-4 rounded-xl glass p-3.5"
      >
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Price Position</h3>
        <div className="space-y-2">
          {[...stores].sort((a, b) => a.price - b.price).map((store, i) => {
            const range = maxPrice - minPrice;
            const barWidth = range === 0 ? 100 : ((store.price - minPrice) / range) * 40 + 60;
            return (
              <div key={store.name} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-14 truncate">{store.name}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: 0.9 + i * 0.08, duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${store.isBestDeal ? "gradient-accent" : "gradient-primary"}`}
                  />
                </div>
                <span className={`text-[10px] font-semibold w-14 text-right ${store.isBestDeal ? "text-accent" : "text-foreground"}`}>
                  ₹{(store.price / 1000).toFixed(1)}k
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StoreComparisonCards;
