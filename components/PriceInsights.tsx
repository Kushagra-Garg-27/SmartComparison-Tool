import React, { useMemo } from 'react';
import { PricePoint } from '../types';
import { ArrowDown, ArrowUp, Minus, HelpCircle } from 'lucide-react';

interface PriceInsightsProps {
  history: PricePoint[];
  currentPrice: number;
}

export const PriceInsights: React.FC<PriceInsightsProps> = ({ history, currentPrice }) => {
  const stats = useMemo(() => {
    if (!history || history.length < 2) return null;

    const prices = history.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = sum / prices.length;

    return { min, max, avg };
  }, [history]);

  if (!stats) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
        <p className="text-xs text-gray-500">Insufficient data for price insights.</p>
      </div>
    );
  }

  const { min, max, avg } = stats;
  
  // Calculate position percentage for the meter (0 to 100%)
  const range = max - min;
  const position = range === 0 ? 50 : ((currentPrice - min) / range) * 100;
  const clampedPosition = Math.max(0, Math.min(100, position));

  // Determine Verdict
  const diffPercent = ((currentPrice - avg) / avg) * 100;
  let verdictColor = "text-gray-600";
  let verdictBg = "bg-gray-100";
  let verdictIcon = <Minus className="h-3 w-3 mr-1" />;
  let verdictText = "Standard Price";

  if (diffPercent <= -5) {
    verdictColor = "text-emerald-700";
    verdictBg = "bg-emerald-50";
    verdictIcon = <ArrowDown className="h-3 w-3 mr-1" />;
    verdictText = "Below Average";
  } else if (diffPercent >= 5) {
    verdictColor = "text-amber-700";
    verdictBg = "bg-amber-50";
    verdictIcon = <ArrowUp className="h-3 w-3 mr-1" />;
    verdictText = "Above Average";
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">30-Day Analysis</h3>
        <div className={`flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${verdictBg} ${verdictColor}`}>
          {verdictIcon}
          {verdictText}
        </div>
      </div>

      <div className="p-4">
        {/* Stat Grid */}
        <div className="grid grid-cols-3 gap-4 mb-5 text-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase">Lowest</span>
            <span className="text-sm font-bold text-gray-900">${min.toFixed(0)}</span>
          </div>
          <div className="flex flex-col border-x border-gray-100">
            <span className="text-[10px] text-gray-400 uppercase">Average</span>
            <span className="text-sm font-bold text-gray-900">${avg.toFixed(0)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase">Highest</span>
            <span className="text-sm font-bold text-gray-900">${max.toFixed(0)}</span>
          </div>
        </div>

        {/* Range Meter */}
        <div className="relative pt-2 pb-1">
          <div className="h-2 bg-gradient-to-r from-emerald-100 via-gray-100 to-amber-100 rounded-full w-full"></div>
          
          {/* Markers */}
          <div 
            className="absolute top-0 w-1 h-full flex flex-col items-center justify-center transition-all duration-500"
            style={{ left: `${clampedPosition}%` }}
          >
            <div className="h-3 w-3 bg-blue-600 rounded-full border-2 border-white shadow-md -mt-1"></div>
            <div className="absolute top-4 w-20 text-center">
              <span className="text-[10px] font-bold text-blue-700 block">Current</span>
              <span className="text-[9px] text-gray-500 block">${currentPrice.toFixed(0)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-[10px] text-gray-400 text-center leading-relaxed">
           The current price is <span className={diffPercent < 0 ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
             {Math.abs(diffPercent).toFixed(1)}% {diffPercent < 0 ? 'lower' : 'higher'}
           </span> than the 30-day average. 
           Calculated from {history.length} data points.
        </div>
      </div>
    </div>
  );
};