import React from 'react';
import { Product } from '../types';
import { ExternalLink, CheckCircle, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Minus, BadgeCheck, Loader2, Search, ArrowLeftRight } from 'lucide-react';
import { resolveMarketplaceUrl } from '../utils/urlUtils';

interface ComparisonTableProps {
  currentProduct: Product;
  competitors: Product[];
  bestPriceId: string | undefined;
  bestValueId: string | undefined;
  trustWarningId: string | null | undefined;
  onRefreshPrices: () => void;
  isRefreshingPrices: boolean;
  lastUpdated: Date;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  currentProduct,
  competitors,
  bestPriceId,
  bestValueId,
  trustWarningId,
  onRefreshPrices,
  isRefreshingPrices,
  lastUpdated
}) => {
  // Filter out failed validations that couldn't be repaired
  const validCompetitors = competitors.filter(c => c.verificationStatus !== 'failed');
  const allProducts = [currentProduct, ...validCompetitors];

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-green-500" />;
      default: return <Minus className="h-3 w-3 text-gray-400" />;
    }
  };

  const getPriceContext = (price: number, average?: number) => {
    if (!average) return null;
    const diff = ((average - price) / average) * 100;
    if (diff > 5) return <span className="text-[10px] text-green-600 font-medium">-{diff.toFixed(0)}% vs Avg</span>;
    if (diff < -5) return <span className="text-[10px] text-red-500 font-medium">+{Math.abs(diff).toFixed(0)}% vs Avg</span>;
    return <span className="text-[10px] text-gray-400">Avg Market Price</span>;
  };

  return (
    <div className="overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-gray-500 font-medium">
            Live Prices • Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <button 
          onClick={onRefreshPrices} 
          disabled={isRefreshingPrices}
          className="flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors bg-white px-2 py-1 rounded border border-gray-200 hover:border-blue-300 shadow-sm"
        >
          <RefreshCw className={`h-3 w-3 mr-1.5 ${isRefreshingPrices ? 'animate-spin' : ''}`} />
          {isRefreshingPrices ? 'Syncing...' : 'Refresh'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cond.</th>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trust</th>
              <th scope="col" className="relative px-3 py-3"><span className="sr-only">Link</span></th>
            </tr>
          </thead>
          <tbody className={`bg-white divide-y divide-gray-200 transition-opacity duration-200 ${isRefreshingPrices ? 'opacity-50' : 'opacity-100'}`}>
            {allProducts.length === 1 && competitors.length > 0 && (
               <tr>
                 <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                   <div className="flex flex-col items-center justify-center space-y-2">
                     <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                     <span>Validating product availability...</span>
                   </div>
                 </td>
               </tr>
            )}
            
            {allProducts.length === 1 && competitors.length === 0 && (
               <tr>
                 <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                   No competitors found in stock.
                 </td>
               </tr>
            )}

            {allProducts.map((p) => {
              // Current product is always displayed
              if (p.id !== currentProduct.id && p.verificationStatus === 'failed') return null;

              const isBestPrice = p.id === bestPriceId;
              const isBestValue = p.id === bestValueId;
              const isWarning = p.id === trustWarningId;
              const finalUrl = resolveMarketplaceUrl(p);
              const hasUrl = finalUrl.length > 0;
              
              const isSearching = p.verificationStatus === 'searching';
              const isVerified = p.verificationStatus === 'verified';
              const isAlternative = p.isAlternative;

              return (
                <tr key={p.id} className={p.id === currentProduct.id ? "bg-blue-50" : ""}>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-gray-900">{p.platform}</span>
                        {isVerified && !isAlternative && <BadgeCheck className="h-3 w-3 text-blue-500" aria-label="Verified Link"/>}
                        {isAlternative && (
                           <span className="flex items-center text-[10px] text-orange-600 bg-orange-100 px-1 rounded border border-orange-200" title="Original link invalid, alternative found">
                             <ArrowLeftRight className="h-2 w-2 mr-0.5" />
                             Alt
                           </span>
                        )}
                        {isSearching && <Loader2 className="h-3 w-3 text-gray-400 animate-spin" />}
                      </div>
                      <span className="text-xs text-gray-500 truncate max-w-[80px]">{p.vendor}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1">
                        <div className="text-sm font-bold text-gray-900">
                          {p.price > 0 ? `$${p.price.toFixed(2)}` : 'Check'}
                        </div>
                        {p.priceTrend && (
                          <div title={`Price is ${p.priceTrend}`}>
                            {getTrendIcon(p.priceTrend)}
                          </div>
                        )}
                      </div>
                      {getPriceContext(p.price, p.averagePrice)}
                    </div>
                    {isBestPrice && <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">Best Price</span>}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                     {p.condition}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${p.sellerTrustScore < 70 ? 'text-red-600' : 'text-gray-900'}`}>
                        {p.sellerTrustScore}%
                      </span>
                      {isWarning && <AlertTriangle className="ml-1 h-4 w-4 text-red-500" />}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isBestValue && (
                       <div className="flex items-center justify-end text-purple-600 mb-1">
                         <CheckCircle className="h-4 w-4 mr-1" />
                         <span className="text-xs">Pick</span>
                       </div>
                    )}
                    {hasUrl ? (
                      <a 
                        href={finalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`inline-block p-1 rounded-full transition-colors ${
                          isVerified ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title={isAlternative ? "Go to Alternative Source" : (isVerified ? "Go to Verified Product Page" : "Validating link...")}
                        aria-label={`Open ${p.title} on ${p.platform}`}
                        onClick={(e) => {
                            if (!isVerified && p.id !== currentProduct.id) {
                                e.preventDefault();
                            }
                        }}
                      >
                        {isVerified ? <ExternalLink className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                      </a>
                    ) : (
                      <span className="text-gray-300 p-1 block">
                         <Search className="h-4 w-4" />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};