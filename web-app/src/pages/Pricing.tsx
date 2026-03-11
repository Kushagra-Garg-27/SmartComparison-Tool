import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

interface Plan {
  name: string;
  icon: typeof Zap;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  gradient: string;
}

const plans: Plan[] = [
  {
    name: "Free",
    icon: Zap,
    price: "₹0",
    period: "forever",
    description: "Basic price comparison across stores",
    features: [
      "Price comparison (4 stores)",
      "Deal Score",
      "Basic AI insights",
      "Price history (30 days)",
    ],
    cta: "Get Started",
    gradient: "from-secondary to-secondary",
  },
  {
    name: "Pro",
    icon: Sparkles,
    price: "₹199",
    period: "/month",
    description: "Advanced analytics and predictions",
    features: [
      "Everything in Free",
      "Price drop alerts",
      "AI deal predictions",
      "90-day price history",
      "Product alternatives",
      "Seller deep analysis",
    ],
    cta: "Start Pro Trial",
    popular: true,
    gradient: "from-primary to-primary/80",
  },
  {
    name: "Premium",
    icon: Crown,
    price: "₹499",
    period: "/month",
    description: "Full AI shopping intelligence",
    features: [
      "Everything in Pro",
      "AI Shopping Assistant",
      "Deal radar & notifications",
      "Market analytics",
      "Unlimited watchlists",
      "Priority support",
      "API access",
    ],
    cta: "Go Premium",
    gradient: "from-accent to-accent/80",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Plans & Pricing"
        subtitle="Choose your intelligence level"
      />

      <div className="max-w-md mx-auto px-3 py-6 space-y-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <h2 className="text-xl font-extrabold text-foreground mb-1">
            Smarter Shopping Starts Here
          </h2>
          <p className="text-xs text-muted-foreground">
            Unlock AI-powered deal intelligence and never overpay again
          </p>
        </motion.div>

        {/* Plan Cards */}
        {plans.map((plan, i) => {
          const PlanIcon = plan.icon;
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={`rounded-2xl glass p-4 relative ${
                plan.popular ? "border-primary/40 glow-primary" : ""
              }`}
            >
              {plan.popular && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -top-2.5 right-3 gradient-primary rounded-full px-2.5 py-0.5"
                >
                  <span className="text-[10px] font-bold text-primary-foreground">MOST POPULAR</span>
                </motion.div>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                    <PlanIcon className="w-4.5 h-4.5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{plan.name}</div>
                    <div className="text-[10px] text-muted-foreground">{plan.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-foreground">{plan.price}</div>
                  <div className="text-[10px] text-muted-foreground">{plan.period}</div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {plan.features.map((feature, fi) => (
                  <motion.div
                    key={fi}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 + fi * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <Check className={`w-3 h-3 flex-shrink-0 ${plan.popular ? "text-primary" : "text-accent"}`} />
                    <span className="text-[11px] text-muted-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  plan.popular
                    ? "gradient-primary text-primary-foreground glow-primary"
                    : plan.name === "Premium"
                    ? "gradient-accent text-accent-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          );
        })}

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-[10px] text-center text-muted-foreground pt-2"
        >
          All plans include a 7-day free trial · Cancel anytime
        </motion.p>
      </div>
    </div>
  );
};

export default Pricing;
