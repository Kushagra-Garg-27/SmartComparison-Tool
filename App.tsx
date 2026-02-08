import React, { useState, useEffect } from 'react';
import { ProductPage } from './components/ProductPage';
import { SmartOverlay } from './components/SmartOverlay';
import { CURRENT_PRODUCT, COMPETITOR_PRODUCTS, MOCK_REVIEWS } from './constants';
import { analyzeProductComparison, findLiveDeals } from './services/geminiService';
import { PriceHistoryService } from './services/priceHistoryService';
import { AnalysisResult, ViewState, Product } from './types';
import { AlertCircle } from 'lucide-react';
import { mapDomainToPlatform } from './utils/urlUtils';

declare var chrome: any;

interface AppProps {
  isExtensionOverride?: boolean;
}

const App: React.FC<AppProps> = ({ isExtensionOverride = false }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  // Default to HIDDEN if extension, MINIMIZED if web demo
  const [viewState, setViewState] = useState<ViewState>(
    isExtensionOverride ? ViewState.HIDDEN : ViewState.MINIMIZED
  );
  
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [isExtensionMode, setIsExtensionMode] = useState(isExtensionOverride);

  // New State for Live Price Updates & Verified Links
  const [competitors, setCompetitors] = useState<Product[]>(
    COMPETITOR_PRODUCTS.map(p => ({ ...p, verificationStatus: 'unverified' }))
  );
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [hasValidated, setHasValidated] = useState(false);

  useEffect(() => {
    // Check for API key presence
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
    }
    
    // Check if running as a Chrome Extension (Side Panel or Popup or Injected)
    if (isExtensionOverride || (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id)) {
      setIsExtensionMode(true);
      // If we are mounting for the first time in extension mode, we might want to start minimized or hidden
      if (!isExtensionOverride) {
         setViewState(ViewState.EXPANDED); // Side panel default
      }
    }

    // Listen for toggle event from content script
    const handleToggle = () => {
      setViewState(prev => prev === ViewState.HIDDEN ? ViewState.EXPANDED : ViewState.HIDDEN);
    };
    window.addEventListener('SMARTCOMPARE_TOGGLE', handleToggle);

    // Initialize/Seed Price History for the current product
    PriceHistoryService.seedMockHistory([CURRENT_PRODUCT]);

    return () => {
      window.removeEventListener('SMARTCOMPARE_TOGGLE', handleToggle);
    };
  }, [isExtensionOverride]);

  // Robust Validation & Discovery Phase
  useEffect(() => {
    const validateAndDiscover = async () => {
      if (hasValidated) return;
      
      if (!process.env.API_KEY) {
        // Fallback for Demo/Mock mode: Skip validation but allow analysis to proceed with mock data
        console.warn("API Key missing: Skipping validation, enabling demo mode.");
        setHasValidated(true);
        return;
      }
      
      // 1. Set all to searching
      setCompetitors(prev => prev.map(p => ({ ...p, verificationStatus: 'searching' })));
      
      // 2. Fetch live confirmed deals from Gemini Search
      const liveDeals = await findLiveDeals(CURRENT_PRODUCT.title);
      
      // 3. Robust Merge & Fallback Strategy
      setCompetitors(prevCompetitors => {
        const nextCompetitors: Product[] = [];
        const matchedDealIndices = new Set<number>();

        // A. Primary Match: Try to verify existing competitors with exact or close matches
        prevCompetitors.forEach(existing => {
          const matchIndex = liveDeals.findIndex((deal, idx) => {
             if (matchedDealIndices.has(idx)) return false;
             const dealPlatform = mapDomainToPlatform(deal.url || '') || deal.vendor;
             // Check if platforms match or vendor names are similar
             return (dealPlatform && existing.platform && dealPlatform.toLowerCase() === existing.platform.toLowerCase()) ||
                    (existing.vendor && deal.vendor && existing.vendor.toLowerCase().includes(deal.vendor.toLowerCase())) ||
                    (existing.vendor && deal.vendor && deal.vendor.toLowerCase().includes(existing.vendor.toLowerCase()));
          });

          if (matchIndex >= 0) {
            // Found exact match -> Update & Verify
            matchedDealIndices.add(matchIndex);
            const match = liveDeals[matchIndex];
            nextCompetitors.push({
              ...existing,
              url: match.url!,
              price: match.price || existing.price,
              verificationStatus: 'verified',
              isAlternative: false
            });
          } else {
            // No direct match found yet -> Mark as failed temporarily (will try fallback below)
            nextCompetitors.push({
              ...existing,
              verificationStatus: 'failed'
            });
          }
        });

        // B. Fallback Strategy: Attempt to "Repair" failed links with unused deals
        // Get all deals that weren't used in the primary match
        const availableDeals = liveDeals.filter((_, idx) => !matchedDealIndices.has(idx));
        
        // Iterate through competitors again to fix failed ones
        const repairedCompetitors = nextCompetitors.map(comp => {
            if (comp.verificationStatus === 'failed') {
                const alternative = availableDeals.shift(); // Take the next available deal
                if (alternative) {
                    const platformName = mapDomainToPlatform(alternative.url!) || alternative.vendor || 'Direct';
                    // Replace the failed entry with this valid alternative
                    return {
                        ...comp,
                        title: alternative.vendor ? `${alternative.vendor} Offer` : comp.title,
                        vendor: alternative.vendor || platformName,
                        price: alternative.price || 0,
                        url: alternative.url!,
                        platform: (mapDomainToPlatform(alternative.url!) || 'Direct') as any,
                        condition: (alternative.condition as any) || 'New',
                        verificationStatus: 'verified',
                        isAlternative: true, // Flag as a fallback replacement
                        sellerTrustScore: 85, // Default good score for verified findings
                        shipping: 'Check Site'
                    } as Product;
                }
            }
            return comp;
        });

        // C. Add any remaining deals as completely new discoveries
        const newDiscoveries = availableDeals.map((deal, idx) => ({
             id: `new-discovery-${Date.now()}-${idx}`,
             title: deal.vendor + " Offer",
             price: deal.price || 0,
             currency: 'USD',
             vendor: deal.vendor || 'Unknown',
             platform: (mapDomainToPlatform(deal.url!) || 'Direct') as any,
             url: deal.url!,
             condition: (deal.condition as any) || 'New',
             verificationStatus: 'verified',
             image: CURRENT_PRODUCT.image,
             rating: 0,
             reviewCount: 0,
             shipping: 'Check Site',
             sellerTrustScore: 80,
             isAlternative: false
        } as Product));

        return [...repairedCompetitors, ...newDiscoveries];
      });
      
      setHasValidated(true);
    };

    if (viewState === ViewState.EXPANDED) {
      validateAndDiscover();
    }
  }, [viewState, hasValidated]);

  // Run Analysis when competitors change (and are validated)
  useEffect(() => {
    const performAnalysis = async () => {
      // Only analyze if we have some verified competitors or we've finished validation
      const validCompetitors = competitors.filter(c => c.verificationStatus === 'verified');
      
      if (viewState === ViewState.EXPANDED && !analysis && !loading && hasValidated) {
        setLoading(true);
        const result = await analyzeProductComparison(
            CURRENT_PRODUCT,
            validCompetitors.length > 0 ? validCompetitors : competitors, // Fallback to all if none verified yet
            MOCK_REVIEWS
        );
        setAnalysis(result);
        setLoading(false);
      }
    };

    performAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewState, hasValidated, competitors.length]); // Re-run if competitor list size changes

  const handleRefreshPrices = async () => {
    setIsRefreshingPrices(true);
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Simple random fluctuation for demo
    const updatedCompetitors = competitors.map(p => ({
      ...p,
      price: Number((p.price * (0.9 + Math.random() * 0.2)).toFixed(2))
    }));

    setCompetitors(updatedCompetitors);
    setLastUpdated(new Date());

    // Track history for updated prices
    updatedCompetitors.forEach(c => {
        if (c.verificationStatus === 'verified') {
            PriceHistoryService.addPricePoint(c.id, c.price, c.vendor);
        }
    });
    PriceHistoryService.addPricePoint(CURRENT_PRODUCT.id, CURRENT_PRODUCT.price, CURRENT_PRODUCT.vendor);
    
    // Re-analyze
    const validCompetitors = updatedCompetitors.filter(c => c.verificationStatus === 'verified');
    if (validCompetitors.length > 0) {
        setLoading(true);
        try {
            const result = await analyzeProductComparison(
                CURRENT_PRODUCT,
                validCompetitors,
                MOCK_REVIEWS
            );
            setAnalysis(result);
        } catch(e) { console.error(e); }
        setLoading(false);
    } else {
        // Fallback re-analysis for demo mode if no valid competitors
         try {
            const result = await analyzeProductComparison(
                CURRENT_PRODUCT,
                updatedCompetitors,
                MOCK_REVIEWS
            );
            setAnalysis(result);
        } catch(e) { console.error(e); }
        setLoading(false);
    }
    setIsRefreshingPrices(false);
  };

  return (
    <div className={`relative min-h-screen ${isExtensionMode ? 'overflow-visible bg-transparent' : 'bg-gray-50'}`}>
      
      {apiKeyMissing && (
         <div className="bg-red-600 text-white px-4 py-2 text-center font-bold sticky top-0 z-[100]">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5"/>
              <span>WARNING: API_KEY is missing. App running in Demo Mode.</span>
            </div>
         </div>
      )}

      {/* Only render background ProductPage if NOT in extension mode */}
      {!isExtensionMode && <ProductPage product={CURRENT_PRODUCT} />}

      <SmartOverlay 
        currentProduct={CURRENT_PRODUCT}
        competitors={competitors} // Pass full list, Table will filter 'failed'
        reviews={MOCK_REVIEWS}
        analysis={analysis}
        loading={loading}
        viewState={viewState}
        setViewState={setViewState}
        onRefreshPrices={handleRefreshPrices}
        isRefreshingPrices={isRefreshingPrices}
        lastUpdated={lastUpdated}
        isPanelMode={isExtensionMode}
      />
    </div>
  );
};

export default App;