import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { PricePoint } from "../types";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChartArea,
  Calendar,
  ArrowDownRight,
  Activity,
  DollarSign,
  BarChart2,
} from "lucide-react";

interface PriceHistoryGraphProps {
  data: PricePoint[];
  productTitle: string;
}

type TimeRange = "7d" | "30d" | "90d";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="glass-card px-3 py-2 shadow-xl border border-white/10">
      <p className="text-[10px] text-white/40 mb-0.5">{label}</p>
      <p className="text-[14px] font-bold text-white">
        ${payload[0].value?.toFixed(2)}
      </p>
      {payload[0].payload?.vendor && (
        <p className="text-[9px] text-ai-indigo/70 mt-0.5">
          {payload[0].payload.vendor}
        </p>
      )}
    </div>
  );
};

export const PriceHistoryGraph: React.FC<PriceHistoryGraphProps> = ({
  data,
  productTitle,
}) => {
  const [range, setRange] = useState<TimeRange>("30d");

  const rangeMs: Record<TimeRange, number> = {
    "7d": 7 * 86400000,
    "30d": 30 * 86400000,
    "90d": 90 * 86400000,
  };

  const filteredData = useMemo(() => {
    const cutoff = Date.now() - rangeMs[range];
    return data
      .filter((d) => d.timestamp >= cutoff)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((d) => ({
        ...d,
        date: new Date(d.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }));
  }, [data, range]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    const prices = filteredData.map((d) => d.price);
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);
    const current = prices[prices.length - 1];
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;
    const volatility = (((highest - lowest) / lowest) * 100).toFixed(1);
    const trend =
      current < prices[0] ? "down" : current > prices[0] ? "up" : "stable";
    const changePercent =
      prices[0] > 0
        ? (((current - prices[0]) / prices[0]) * 100).toFixed(1)
        : "0";
    return {
      lowest,
      highest,
      current,
      average,
      volatility,
      trend,
      changePercent,
    };
  }, [filteredData]);

  const ranges: TimeRange[] = ["7d", "30d", "90d"];

  return (
    <motion.div
      className="glass-section p-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45 }}
    >
      {/* Header row with time range selector */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-ai-purple/20 to-ai-blue/20 flex items-center justify-center">
            <ChartArea className="w-3 h-3 text-ai-purple" />
          </div>
          <h2 className="text-[13px] font-bold text-white/90 tracking-tight">
            Price History
          </h2>
        </div>
        <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.05]">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                range === r
                  ? "bg-ai-indigo/15 text-ai-indigo"
                  : "text-white/25 hover:text-white/45"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Insight chips row */}
      {stats && (
        <motion.div
          className="flex gap-2 mb-3 overflow-x-auto scrollbar-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="insight-chip">
            <ArrowDownRight className="w-2.5 h-2.5 text-deal" />
            <span className="text-[10px] text-white/50">Low</span>
            <span className="text-[11px] font-bold text-deal">
              ${stats.lowest.toFixed(0)}
            </span>
          </div>
          <div className="insight-chip">
            <Activity className="w-2.5 h-2.5 text-warning" />
            <span className="text-[10px] text-white/50">Vol</span>
            <span className="text-[11px] font-bold text-warning">
              {stats.volatility}%
            </span>
          </div>
          <div className="insight-chip">
            {stats.trend === "down" ? (
              <TrendingDown className="w-2.5 h-2.5 text-deal" />
            ) : stats.trend === "up" ? (
              <TrendingUp className="w-2.5 h-2.5 text-risk" />
            ) : (
              <Minus className="w-2.5 h-2.5 text-white/30" />
            )}
            <span
              className={`text-[11px] font-bold ${
                stats.trend === "down"
                  ? "text-deal"
                  : stats.trend === "up"
                    ? "text-risk"
                    : "text-white/40"
              }`}
            >
              {stats.changePercent}%
            </span>
          </div>
          <div className="insight-chip">
            <BarChart2 className="w-2.5 h-2.5 text-ai-purple" />
            <span className="text-[10px] text-white/50">Avg</span>
            <span className="text-[11px] font-bold text-ai-purple">
              ${stats.average.toFixed(0)}
            </span>
          </div>
          <div className="insight-chip">
            <DollarSign className="w-2.5 h-2.5 text-ai-blue" />
            <span className="text-[10px] text-white/50">Now</span>
            <span className="text-[11px] font-bold text-ai-blue">
              ${stats.current.toFixed(0)}
            </span>
          </div>
        </motion.div>
      )}

      {/* Chart */}
      <motion.div
        className="h-[150px] w-full"
        initial={{ opacity: 0, scaleY: 0.85 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {filteredData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `$${v}`}
              />
              {stats && (
                <ReferenceLine
                  y={stats.average}
                  stroke="rgba(139,92,246,0.2)"
                  strokeDasharray="4 4"
                  label={false}
                />
              )}
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "rgba(99,102,241,0.2)",
                  strokeDasharray: "4 4",
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="url(#lineGrad)"
                strokeWidth={2}
                fill="url(#priceGrad)"
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Calendar className="w-6 h-6 text-white/10 mx-auto mb-2" />
              <p className="text-[11px] text-white/25">
                Not enough data for this range
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Contextual insight banner */}
      {stats && stats.trend === "down" && (
        <motion.div
          className="mt-3 flex items-center gap-2 bg-deal/[0.06] rounded-xl px-3 py-2 border border-deal/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <TrendingDown className="w-3.5 h-3.5 text-deal flex-shrink-0" />
          <p className="text-[10px] text-deal/80">
            Price is trending down — good time to buy
          </p>
        </motion.div>
      )}
      {stats && stats.trend === "up" && (
        <motion.div
          className="mt-3 flex items-center gap-2 bg-warning/[0.06] rounded-xl px-3 py-2 border border-warning/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <TrendingUp className="w-3.5 h-3.5 text-warning flex-shrink-0" />
          <p className="text-[10px] text-warning/80">
            Price is rising — consider buying soon
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
