import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { PricePoint } from "../types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingDown, TrendingUp, Calendar, Target, Zap } from "lucide-react";

interface PriceHistoryChartProps {
  data: PricePoint[];
  productTitle: string;
}

type TimeRange = "1W" | "1M" | "ALL";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="glass-card px-3 py-2 border border-indigo-500/30 shadow-xl">
      <p className="text-sm font-bold text-white">${point.price.toFixed(2)}</p>
      <p className="text-[10px] text-white/50">
        {new Date(point.timestamp).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <p className="text-[9px] text-indigo-300 mt-0.5">{point.vendor}</p>
    </div>
  );
};

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  data,
  productTitle,
}) => {
  const [range, setRange] = useState<TimeRange>("1M");

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    const now = Date.now();
    const oneDay = 86400000;
    let cutoff = 0;
    if (range === "1W") cutoff = now - oneDay * 7;
    if (range === "1M") cutoff = now - oneDay * 30;
    return data.filter((d) => d.timestamp >= cutoff);
  }, [data, range]);

  if (filteredData.length < 2) {
    return (
      <motion.div
        className="glass-card p-6 flex flex-col items-center justify-center text-white/30"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Calendar className="h-6 w-6 mb-2" />
        <span className="text-xs">Not enough price history yet.</span>
      </motion.div>
    );
  }

  const prices = filteredData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const currentPrice = filteredData[filteredData.length - 1].price;
  const startPrice = filteredData[0].price;
  const change = currentPrice - startPrice;
  const percentChange = ((change / startPrice) * 100).toFixed(1);
  const lowestPoint = filteredData.reduce((prev, curr) =>
    curr.price < prev.price ? curr : prev,
  );

  // Estimate drop probability (simple heuristic)
  const recentPrices = filteredData.slice(-5).map((d) => d.price);
  const isDescending =
    recentPrices.length >= 3 &&
    recentPrices[recentPrices.length - 1] < recentPrices[0];
  const dropProbability = isDescending ? "High" : "Low";

  return (
    <motion.div
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Insight pills */}
      <div className="px-4 pt-4 pb-2 flex flex-wrap gap-2">
        <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
          <Target className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-medium text-emerald-300">
            Low: ${minPrice.toFixed(0)}
          </span>
        </div>
        <div className="flex items-center space-x-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-2.5 py-1.5">
          <Zap className="h-3 w-3 text-indigo-400" />
          <span className="text-[10px] font-medium text-indigo-300">
            Drop chance: {dropProbability}
          </span>
        </div>
        {currentPrice <= avgPrice && (
          <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
            <TrendingDown className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-medium text-amber-300">
              Below avg
            </span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start px-4 pb-2">
        <div>
          <div className="text-[10px] text-white/30 uppercase font-semibold tracking-widest">
            Price Trend
          </div>
          <div className="flex items-end space-x-2 mt-0.5">
            <span className="text-2xl font-extrabold text-white">
              ${currentPrice.toFixed(2)}
            </span>
            <span
              className={`flex items-center text-xs font-semibold mb-1 ${change < 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {change < 0 ? (
                <TrendingDown className="h-3 w-3 mr-0.5" />
              ) : (
                <TrendingUp className="h-3 w-3 mr-0.5" />
              )}
              {Math.abs(Number(percentChange))}%
            </span>
          </div>
        </div>
        <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
          {(["1W", "1M", "ALL"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-all ${
                range === r
                  ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/30"
                  : "text-white/30 hover:text-white/50 border border-transparent"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-3" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#6366f1" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
              tickFormatter={(ts) =>
                new Date(ts).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              }
              interval="preserveStartEnd"
            />
            <YAxis
              domain={["auto", "auto"]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgPrice}
              stroke="rgba(99,102,241,0.3)"
              strokeDasharray="3 3"
              label={{
                value: "Avg",
                fill: "rgba(99,102,241,0.5)",
                fontSize: 9,
                position: "insideTopRight",
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#priceGradient)"
              animationDuration={1500}
              animationEasing="ease-out"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#6366f1",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex justify-between items-center text-[9px] text-white/20">
        <span className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1" />
          Lowest: ${lowestPoint.price.toFixed(2)} on{" "}
          {new Date(lowestPoint.timestamp).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span className="flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          Price tracking active
        </span>
      </div>
    </motion.div>
  );
};
