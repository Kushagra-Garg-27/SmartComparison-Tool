import React, { useState, useMemo } from 'react';
import { PricePoint } from '../types';
import { Calendar, TrendingDown, TrendingUp, Info } from 'lucide-react';

interface PriceHistoryChartProps {
  data: PricePoint[];
  productTitle: string;
}

type TimeRange = '1W' | '1M' | 'ALL';

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data, productTitle }) => {
  const [range, setRange] = useState<TimeRange>('1M');
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{x: number, y: number} | null>(null);

  // Filter Data based on Range
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    const now = Date.now();
    const oneDay = 86400000;
    
    let cutoff = 0;
    if (range === '1W') cutoff = now - (oneDay * 7);
    if (range === '1M') cutoff = now - (oneDay * 30);
    
    return data.filter(d => d.timestamp >= cutoff);
  }, [data, range]);

  // Dimensions
  const width = 100; // viewBox units
  const height = 50; // viewBox units
  const padding = 5;

  if (filteredData.length < 2) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
        <Info className="h-6 w-6 mb-2" />
        <span className="text-xs">Not enough price history yet.</span>
      </div>
    );
  }

  // Calculate Scales
  const prices = filteredData.map(d => d.price);
  const minPrice = Math.min(...prices) * 0.98; // Add little buffer
  const maxPrice = Math.max(...prices) * 1.02;
  const minTime = filteredData[0].timestamp;
  const maxTime = filteredData[filteredData.length - 1].timestamp;

  const getX = (timestamp: number) => {
    return padding + ((timestamp - minTime) / (maxTime - minTime)) * (width - (padding * 2));
  };

  const getY = (price: number) => {
    return height - padding - ((price - minPrice) / (maxPrice - minPrice)) * (height - (padding * 2));
  };

  // Generate Path
  const points = filteredData.map(d => `${getX(d.timestamp)},${getY(d.price)}`).join(' ');
  const areaPoints = `${getX(minTime)},${height} ${points} ${getX(maxTime)},${height}`;

  // Find Lowest Price Point
  const lowestPoint = filteredData.reduce((prev, curr) => curr.price < prev.price ? curr : prev);
  const highestPoint = filteredData.reduce((prev, curr) => curr.price > prev.price ? curr : prev);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Map visual X back to Data Index
    const relativeX = (x / rect.width) * width; // Convert to viewBox coordinates
    const chartX = Math.max(padding, Math.min(width - padding, relativeX));
    const percentX = (chartX - padding) / (width - padding * 2);
    const timeAtX = minTime + (percentX * (maxTime - minTime));

    // Find closest point
    const closest = filteredData.reduce((prev, curr) => {
      return Math.abs(curr.timestamp - timeAtX) < Math.abs(prev.timestamp - timeAtX) ? curr : prev;
    });

    setHoveredPoint(closest);
    setHoverPos({ x: getX(closest.timestamp), y: getY(closest.price) });
  };

  const currentPrice = filteredData[filteredData.length - 1].price;
  const startPrice = filteredData[0].price;
  const change = currentPrice - startPrice;
  const percentChange = ((change / startPrice) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
           <div className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Price Trend</div>
           <div className="flex items-end space-x-2">
             <span className="text-2xl font-bold text-gray-900">${currentPrice.toFixed(2)}</span>
             <span className={`flex items-center text-xs font-medium mb-1.5 ${change < 0 ? 'text-green-600' : 'text-red-500'}`}>
               {change < 0 ? <TrendingDown className="h-3 w-3 mr-0.5" /> : <TrendingUp className="h-3 w-3 mr-0.5" />}
               {Math.abs(Number(percentChange))}% ({range})
             </span>
           </div>
        </div>
        <div className="flex bg-gray-100 p-0.5 rounded-lg">
          {(['1W', '1M', 'ALL'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
                range === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full h-48">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setHoveredPoint(null); setHoverPos(null); }}
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f3f4f6" strokeWidth="0.5" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f3f4f6" strokeWidth="0.5" />

          {/* Area Fill */}
          <path d={areaPoints} fill="url(#chartGradient)" />

          {/* Line Chart */}
          <polyline 
            points={points} 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="1" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="drop-shadow-sm"
          />

          {/* Lowest Price Marker (always visible) */}
          <circle cx={getX(lowestPoint.timestamp)} cy={getY(lowestPoint.price)} r="1.5" fill="#10b981" />
          
          {/* Interactive Tooltip Cursor */}
          {hoveredPoint && hoverPos && (
             <g>
                {/* Vertical Line */}
                <line 
                  x1={hoverPos.x} y1={padding} 
                  x2={hoverPos.x} y2={height - padding} 
                  stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="1,1" 
                />
                {/* Point Highlight */}
                <circle cx={hoverPos.x} cy={hoverPos.y} r="2" fill="white" stroke="#3b82f6" strokeWidth="1" />
             </g>
          )}
        </svg>

        {/* Floating HTML Tooltip for better text rendering */}
        {hoveredPoint && hoverPos && (
          <div 
            className="absolute z-10 pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg transform -translate-x-1/2 -translate-y-full"
            style={{ 
              left: `${(hoverPos.x / width) * 100}%`, 
              top: `${(hoverPos.y / height) * 100}%`,
              marginTop: '-8px'
            }}
          >
            <div className="font-bold">${hoveredPoint.price.toFixed(2)}</div>
            <div className="text-[9px] text-gray-300">
              {new Date(hoveredPoint.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
            <div className="text-[8px] text-gray-400 mt-0.5">{hoveredPoint.vendor}</div>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between items-center text-[10px] text-gray-400">
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span> Lowest: ${lowestPoint.price.toFixed(2)}</span>
        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> Data collected via daily snapshots</span>
      </div>
    </div>
  );
};
