import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from "recharts";
import { TrendingDown, Clock, Target } from "lucide-react";

interface PriceDataPoint {
  date: string;
  price: number;
}

interface PriceInsight {
  type: "low" | "drop" | "buy";
  label: string;
  value: string;
}

interface PriceHistoryChartProps {
  data: PriceDataPoint[];
  insights?: PriceInsight[];
}

const insightIcons = {
  low: TrendingDown,
  drop: Target,
  buy: Clock,
};

const insightColors = {
  low: "text-accent",
  drop: "text-primary",
  buy: "text-glow-warning",
};

const CustomTooltip = ({ active, payload, label, lowestPrice, highestPrice }: any) => {
  if (active && payload?.length) {
    const price = payload[0].value;
    const isLow = price === lowestPrice;
    const isHigh = price === highestPrice;
    return (
      <div className="glass-strong rounded-lg px-3 py-2 shadow-xl border border-border/50">
        <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
        <p className={`text-sm font-bold ${isLow ? "text-accent" : isHigh ? "text-glow-warning" : "text-foreground"}`}>
          ₹{price.toLocaleString()}
        </p>
        {isLow && <p className="text-[9px] text-accent mt-0.5">● Lowest</p>}
        {isHigh && <p className="text-[9px] text-glow-warning mt-0.5">● Highest</p>}
      </div>
    );
  }
  return null;
};

const PriceHistoryChart = ({ data, insights = [] }: PriceHistoryChartProps) => {
  const lowestPrice = Math.min(...data.map((d) => d.price));
  const highestPrice = Math.max(...data.map((d) => d.price));
  const currentPrice = data[data.length - 1]?.price ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="rounded-2xl glass p-4"
    >
      <h2 className="text-sm font-semibold text-foreground mb-3">Price History</h2>

      {/* Insight chips */}
      {insights.length > 0 && (
        <div className="flex gap-2 mb-4">
          {insights.map((item, i) => {
            const Icon = insightIcons[item.type];
            const color = insightColors[item.type];
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex-1 rounded-lg bg-secondary/60 p-2.5 hover:bg-secondary/80 transition-colors cursor-default"
              >
                <div className="flex items-center gap-1 mb-1">
                  <Icon className={`w-3 h-3 ${color}`} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</span>
                </div>
                <div className={`text-xs font-bold ${color}`}>{item.value}</div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="h-44"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.4} />
                <stop offset="50%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              domain={["dataMin - 1000", "dataMax + 1000"]}
            />
            <Tooltip content={<CustomTooltip lowestPrice={lowestPrice} highestPrice={highestPrice} />} />
            <ReferenceLine
              y={currentPrice}
              stroke="hsl(142, 71%, 45%)"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(239, 84%, 67%)"
              strokeWidth={2.5}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 5, fill: "hsl(239, 84%, 67%)", stroke: "hsl(222, 47%, 6%)", strokeWidth: 2 }}
            />
            {/* Lowest point marker */}
            <ReferenceDot
              x={data.find((d) => d.price === lowestPrice)?.date}
              y={lowestPrice}
              r={4}
              fill="hsl(142, 71%, 45%)"
              stroke="hsl(222, 47%, 6%)"
              strokeWidth={2}
            />
            {/* Highest point marker */}
            <ReferenceDot
              x={data.find((d) => d.price === highestPrice)?.date}
              y={highestPrice}
              r={4}
              fill="hsl(38, 92%, 50%)"
              stroke="hsl(222, 47%, 6%)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-[9px] text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-glow-warning" />
          <span className="text-[9px] text-muted-foreground">High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-px border-t border-dashed border-accent" />
          <span className="text-[9px] text-muted-foreground">Current</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PriceHistoryChart;
