import { motion } from "framer-motion";
import { ShieldCheck, Truck, RotateCcw, AlertTriangle } from "lucide-react";

interface SellerMetric {
  store: string;
  authorized: boolean;
  delivery: number;
  returnPolicy: number;
  overall: number;
  warning?: string;
}

interface SellerTrustPanelProps {
  sellers: SellerMetric[];
}

const getBarColor = (val: number) => {
  if (val >= 90) return "bg-accent";
  if (val >= 75) return "bg-primary";
  return "bg-glow-warning";
};

const SellerTrustPanel = ({ sellers }: SellerTrustPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="rounded-2xl glass p-4"
    >
      <h2 className="text-sm font-semibold text-foreground mb-3">Seller Trust Analysis</h2>

      <div className="space-y-3">
        {sellers.map((seller, idx) => (
          <motion.div
            key={seller.store}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 + idx * 0.1 }}
            className="rounded-xl bg-secondary/40 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">{seller.store}</span>
                {seller.authorized ? (
                  <ShieldCheck className="w-3 h-3 text-accent" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-glow-warning" />
                )}
              </div>
              <span className={`text-xs font-bold ${seller.overall >= 90 ? "text-accent" : seller.overall >= 75 ? "text-primary" : "text-glow-warning"}`}>
                {seller.overall}%
              </span>
            </div>

            {/* Bars */}
            <div className="space-y-1.5">
              {[
                { label: "Delivery", value: seller.delivery, icon: Truck },
                { label: "Returns", value: seller.returnPolicy, icon: RotateCcw },
              ].map((metric) => (
                <div key={metric.label} className="flex items-center gap-2">
                  <metric.icon className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground w-12">{metric.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ delay: 0.8 + idx * 0.1, duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${getBarColor(metric.value)}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-6 text-right">{metric.value}%</span>
                </div>
              ))}
            </div>

            {seller.warning && (
              <div className="mt-2 flex items-center gap-1 text-[10px] text-glow-warning">
                <AlertTriangle className="w-2.5 h-2.5" />
                {seller.warning}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SellerTrustPanel;
