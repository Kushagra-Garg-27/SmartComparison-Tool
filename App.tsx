import React, { useState, useEffect, useMemo } from "react";
import { ProductPage } from "./components/ProductPage";
import { SmartOverlay } from "./components/SmartOverlay";
import {
  CURRENT_PRODUCT,
  COMPETITOR_PRODUCTS,
  MOCK_REVIEWS,
} from "./constants";
import {
  analyzeProductComparison,
  findLiveDeals,
  checkAuthStatus,
} from "./services/geminiService";
import {
  identifyProduct,
  getComparisons,
  getPriceHistory,
} from "./services/backendService";
import { PriceHistoryService } from "./services/priceHistoryService";
import { AnalysisResult, ViewState, Product } from "./types";
import { AlertCircle } from "lucide-react";
import { mapDomainToPlatform } from "./utils/urlUtils";
import { DetectedProduct } from "./detectors/types";

declare var chrome: any;

/** Converts raw DOM extraction result to the Product type used throughout the UI */
function convertDetectedToProduct(detected: DetectedProduct): Product {
  const platformMap: Record<string, Product["platform"]> = {
    Amazon: "Amazon",
    eBay: "eBay",
    BestBuy: "BestBuy",
    Walmart: "Walmart",
    Flipkart: "Flipkart",
  };
  return {
    id: `detected-${detected.platform.toLowerCase()}-${detected.externalId || Date.now()}`,
    externalId: detected.externalId || undefined,
    title: detected.title,
    price: detected.price || 0,
    currency: detected.currency,
    vendor: detected.platform,
    image: detected.image || "",
    rating: detected.rating || 0,
    reviewCount: detected.reviewCount || 0,
    condition: "New",
    shipping: "",
    sellerTrustScore: 0,
    url: detected.url,
    platform: platformMap[detected.platform] || "Direct",
  };
}

interface AppProps {
  initialViewState?: ViewState;
  detectedProduct?: DetectedProduct | null;
}

const App: React.FC<AppProps> = ({ initialViewState, detectedProduct }) => {
  // Resolve active product: real detection → demo fallback
  const activeProduct: Product = useMemo(() => {
    if (detectedProduct) return convertDetectedToProduct(detectedProduct);
    return CURRENT_PRODUCT;
  }, [detectedProduct]);
  const isRealProduct = !!detectedProduct;

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // In the side panel, the view is always expanded.
  const viewState = initialViewState ?? ViewState.EXPANDED;

  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [isExtensionMode, setIsExtensionMode] = useState(false);

  // New State for Live Price Updates & Verified Links
  const [competitors, setCompetitors] = useState<Product[]>(() =>
    isRealProduct
      ? []
      : COMPETITOR_PRODUCTS.map((p) => ({
          ...p,
          verificationStatus: "unverified",
        })),
  );
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [hasValidated, setHasValidated] = useState(false);

  // Backend integration state
  const [backendProductId, setBackendProductId] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);

  const productIdentity = useMemo(() => {
    if (!detectedProduct) return "demo-mode";
    return [
      detectedProduct.platform,
      detectedProduct.externalId || "",
      detectedProduct.url,
    ].join("|");
  }, [detectedProduct]);

  useEffect(() => {
    const init = async () => {
      // Check if running as a Chrome Extension (Side Panel or Popup or Injected)
      const isExt =
        typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

      if (isExt) {
        setIsExtensionMode(true);
        // Securely check API key status without exposing it
        const hasKey = await checkAuthStatus();
        if (!hasKey) {
          setApiKeyMissing(true);
        }
      } else {
        // In web/demo mode, we assume key is missing because we can't access background
        setApiKeyMissing(true);
      }
    };
    init();

    // Initialize/Seed Price History (demo mode only — real history comes from backend)
    if (!isRealProduct) PriceHistoryService.seedMockHistory([activeProduct]);
  }, []);

  useEffect(() => {
    // A new detected product should always re-run discovery and analysis.
    setAnalysis(null);
    setBackendProductId(null);
    setBackendOnline(false);
    setHasValidated(false);
    setLastUpdated(new Date());

    if (isRealProduct) {
      setCompetitors([]);
    } else {
      setCompetitors(
        COMPETITOR_PRODUCTS.map((p) => ({
          ...p,
          verificationStatus: "unverified" as const,
        })),
      );
    }
  }, [productIdentity, isRealProduct]);

  // Robust Validation & Discovery Phase
  useEffect(() => {
    const validateAndDiscover = async () => {
      if (hasValidated) return;

      // --- Backend-first flow for real detected products ---
      if (isRealProduct && detectedProduct) {
        try {
          const identifyResult = await identifyProduct(detectedProduct);

          if (identifyResult) {
            setBackendProductId(identifyResult.productId);
            setBackendOnline(true);

            // Convert backend listings → Product[] for the UI
            const backendCompetitors: Product[] = identifyResult.listings
              .filter((l) => l.platform !== detectedProduct.platform)
              .map((listing, idx) => ({
                id: `backend-${listing.platform.toLowerCase()}-${idx}`,
                externalId: listing.externalId || undefined,
                title: listing.title,
                price: listing.price,
                currency: listing.currency,
                vendor: listing.seller,
                image: activeProduct.image,
                rating: 0,
                reviewCount: 0,
                condition: (listing.condition as any) || "New",
                shipping: "Check Site",
                sellerTrustScore: listing.sellerTrustScore,
                url: listing.url,
                platform: (listing.platform as any) || "Direct",
                verificationStatus: "verified" as const,
                isAlternative: false,
              }));

            setCompetitors(backendCompetitors);
            setHasValidated(true);

            // Fetch price history from backend and seed the chart service
            const historyResult = await getPriceHistory(
              identifyResult.productId,
            );
            if (historyResult && historyResult.history) {
              historyResult.history.forEach((p) => {
                PriceHistoryService.addPricePoint(
                  activeProduct.id,
                  p.price,
                  p.vendor,
                );
              });
            }

            return; // Backend handled everything
          }
        } catch (err) {
          console.warn(
            "[SmartCompare] Backend identify failed, falling back to LLM:",
            err,
          );
        }
      }

      // --- Fallback: LLM-based flow (demo mode or backend offline) ---

      if (apiKeyMissing) {
        // Fallback for Demo/Mock mode: Skip validation but allow analysis to proceed with mock data
        console.warn(
          "API Key missing: Skipping validation, enabling demo mode.",
        );
        setHasValidated(true);
        return;
      }

      // 1. Set all to searching
      setCompetitors((prev) =>
        prev.map((p) => ({ ...p, verificationStatus: "searching" })),
      );

      // 2. Fetch live confirmed deals from Gemini Search
      const liveDeals = await findLiveDeals(activeProduct.title);

      // 3. Robust Merge & Fallback Strategy
      setCompetitors((prevCompetitors) => {
        const nextCompetitors: Product[] = [];
        const matchedDealIndices = new Set<number>();

        // A. Primary Match: Try to verify existing competitors with exact or close matches
        prevCompetitors.forEach((existing) => {
          const matchIndex = liveDeals.findIndex((deal, idx) => {
            if (matchedDealIndices.has(idx)) return false;
            const dealPlatform =
              mapDomainToPlatform(deal.url || "") || deal.vendor;
            // Check if platforms match or vendor names are similar
            return (
              (dealPlatform &&
                existing.platform &&
                dealPlatform.toLowerCase() ===
                  existing.platform.toLowerCase()) ||
              (existing.vendor &&
                deal.vendor &&
                existing.vendor
                  .toLowerCase()
                  .includes(deal.vendor.toLowerCase())) ||
              (existing.vendor &&
                deal.vendor &&
                deal.vendor
                  .toLowerCase()
                  .includes(existing.vendor.toLowerCase()))
            );
          });

          if (matchIndex >= 0) {
            // Found exact match -> Update & Verify
            matchedDealIndices.add(matchIndex);
            const match = liveDeals[matchIndex];
            nextCompetitors.push({
              ...existing,
              url: match.url!,
              price: match.price || existing.price,
              verificationStatus: "verified",
              isAlternative: false,
            });
          } else {
            // No direct match found yet -> Mark as failed temporarily (will try fallback below)
            nextCompetitors.push({
              ...existing,
              verificationStatus: "failed",
            });
          }
        });

        // B. Fallback Strategy: Attempt to "Repair" failed links with unused deals
        // Get all deals that weren't used in the primary match
        const availableDeals = liveDeals.filter(
          (_, idx) => !matchedDealIndices.has(idx),
        );

        // Iterate through competitors again to fix failed ones
        const repairedCompetitors = nextCompetitors.map((comp) => {
          if (comp.verificationStatus === "failed") {
            const alternative = availableDeals.shift(); // Take the next available deal
            if (alternative) {
              const platformName =
                mapDomainToPlatform(alternative.url!) ||
                alternative.vendor ||
                "Direct";
              // Replace the failed entry with this valid alternative
              return {
                ...comp,
                title: alternative.vendor
                  ? `${alternative.vendor} Offer`
                  : comp.title,
                vendor: alternative.vendor || platformName,
                price: alternative.price || 0,
                url: alternative.url!,
                platform: (mapDomainToPlatform(alternative.url!) ||
                  "Direct") as any,
                condition: (alternative.condition as any) || "New",
                verificationStatus: "verified",
                isAlternative: true, // Flag as a fallback replacement
                sellerTrustScore: 85, // Default good score for verified findings
                shipping: "Check Site",
              } as Product;
            }
          }
          return comp;
        });

        // C. Add any remaining deals as completely new discoveries
        const newDiscoveries = availableDeals.map(
          (deal, idx) =>
            ({
              id: `new-discovery-${Date.now()}-${idx}`,
              title: deal.vendor + " Offer",
              price: deal.price || 0,
              currency: "USD",
              vendor: deal.vendor || "Unknown",
              platform: (mapDomainToPlatform(deal.url!) || "Direct") as any,
              url: deal.url!,
              condition: (deal.condition as any) || "New",
              verificationStatus: "verified",
              image: activeProduct.image,
              rating: 0,
              reviewCount: 0,
              shipping: "Check Site",
              sellerTrustScore: 80,
              isAlternative: false,
            }) as Product,
        );

        return [...repairedCompetitors, ...newDiscoveries];
      });

      setHasValidated(true);
    };

    if (viewState === ViewState.EXPANDED) {
      validateAndDiscover();
    }
  }, [viewState, hasValidated, apiKeyMissing]);

  // Run Analysis when competitors change (and are validated)
  useEffect(() => {
    const performAnalysis = async () => {
      // Only analyze if we have some verified competitors or we've finished validation
      const validCompetitors = competitors.filter(
        (c) => c.verificationStatus === "verified",
      );

      if (
        viewState === ViewState.EXPANDED &&
        !analysis &&
        !loading &&
        hasValidated
      ) {
        setLoading(true);
        const result = await analyzeProductComparison(
          activeProduct,
          validCompetitors.length > 0 ? validCompetitors : competitors, // Fallback to all if none verified yet
          MOCK_REVIEWS,
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

    // --- Backend refresh path ---
    if (backendOnline && backendProductId) {
      try {
        const compareResult = await getComparisons(
          backendProductId,
          activeProduct.platform as string,
        );
        if (compareResult && compareResult.competitors) {
          const refreshed: Product[] = compareResult.competitors.map(
            (listing, idx) => ({
              id: `backend-${listing.platform.toLowerCase()}-${idx}`,
              externalId: listing.externalId || undefined,
              title: listing.title,
              price: listing.price,
              currency: listing.currency,
              vendor: listing.seller,
              image: activeProduct.image,
              rating: 0,
              reviewCount: 0,
              condition: (listing.condition as any) || "New",
              shipping: "Check Site",
              sellerTrustScore: listing.sellerTrustScore,
              url: listing.url,
              platform: (listing.platform as any) || "Direct",
              verificationStatus: "verified" as const,
              isAlternative: false,
            }),
          );

          setCompetitors(refreshed);
          setLastUpdated(new Date());

          // Re-analyze with updated data
          if (refreshed.length > 0) {
            setLoading(true);
            try {
              const result = await analyzeProductComparison(
                activeProduct,
                refreshed,
                MOCK_REVIEWS,
              );
              setAnalysis(result);
            } catch (e) {
              console.error(e);
            }
            setLoading(false);
          }

          setIsRefreshingPrices(false);
          return;
        }
      } catch (err) {
        console.warn(
          "[SmartCompare] Backend refresh failed, falling back:",
          err,
        );
      }
    }

    // --- Fallback: Demo/LLM refresh ---
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Simple random fluctuation for demo
    const updatedCompetitors = competitors.map((p) => ({
      ...p,
      price: Number((p.price * (0.9 + Math.random() * 0.2)).toFixed(2)),
    }));

    setCompetitors(updatedCompetitors);
    setLastUpdated(new Date());

    // Track history for updated prices
    updatedCompetitors.forEach((c) => {
      if (c.verificationStatus === "verified") {
        PriceHistoryService.addPricePoint(c.id, c.price, c.vendor);
      }
    });
    PriceHistoryService.addPricePoint(
      activeProduct.id,
      activeProduct.price,
      activeProduct.vendor,
    );

    // Re-analyze
    const validCompetitors = updatedCompetitors.filter(
      (c) => c.verificationStatus === "verified",
    );
    if (validCompetitors.length > 0) {
      setLoading(true);
      try {
        const result = await analyzeProductComparison(
          activeProduct,
          validCompetitors,
          MOCK_REVIEWS,
        );
        setAnalysis(result);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    } else {
      // Fallback re-analysis for demo mode if no valid competitors
      try {
        const result = await analyzeProductComparison(
          activeProduct,
          updatedCompetitors,
          MOCK_REVIEWS,
        );
        setAnalysis(result);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    setIsRefreshingPrices(false);
  };

  return (
    <div
      className={`relative min-h-screen ${isExtensionMode ? "overflow-visible bg-transparent" : "bg-space"}`}
    >
      {apiKeyMissing && (
        <div className="bg-gradient-to-r from-red-500/90 to-red-600/90 backdrop-blur-sm text-white px-4 py-2 text-center font-bold sticky top-0 z-[100]">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">
              API_KEY missing — Running in Demo Mode
            </span>
          </div>
        </div>
      )}

      {/* Only render background ProductPage if NOT in extension mode */}
      {!isExtensionMode && <ProductPage product={activeProduct} />}

      <SmartOverlay
        currentProduct={activeProduct}
        competitors={competitors}
        reviews={MOCK_REVIEWS}
        analysis={analysis}
        loading={loading}
        onRefreshPrices={handleRefreshPrices}
        isRefreshingPrices={isRefreshingPrices}
        lastUpdated={lastUpdated}
      />
    </div>
  );
};

export default App;
