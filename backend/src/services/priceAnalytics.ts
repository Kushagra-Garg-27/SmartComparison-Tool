/**
 * Price Analytics Service — Statistical analysis and insights.
 *
 * Computes:
 * - Price volatility
 * - Price drop detection
 * - Trend analysis
 * - Best time to buy predictions
 * - Anomaly detection
 */

import { DatabaseStore } from "../store/databaseStore.js";
import { cache, CacheKeys, CacheTTL, type CacheProvider } from "./cache.js";

export interface PriceAnalytics {
  productId: string;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  medianPrice: number;
  /** Standard deviation of prices */
  volatility: number;
  /** Percentage change from 30-day average */
  priceChangePct: number;
  /** Current trend direction */
  trend: "up" | "down" | "stable";
  /** Trend strength (0–1) */
  trendStrength: number;
  /** Price drop detected in last 7 days */
  recentDrop: PriceDrop | null;
  /** Price positions by store */
  storeRankings: StoreRanking[];
  /** Number of data points used */
  dataPoints: number;
  /** Number of unique sources */
  sources: number;
  /** When analytics were computed */
  computedAt: string;
}

export interface PriceDrop {
  fromPrice: number;
  toPrice: number;
  dropAmount: number;
  dropPercent: number;
  store: string;
  detectedAt: string;
}

export interface StoreRanking {
  store: string;
  price: number;
  rank: number;
  /** How far from the lowest price (percentage) */
  premiumPercent: number;
  /** Whether this is the best deal */
  isBestDeal: boolean;
}

export interface PricePrediction {
  recommendation: "BUY" | "WAIT" | "NEUTRAL";
  confidence: number;
  expectedDropPercent: number | null;
  expectedDropAmount: number | null;
  bestBuyWindow: string | null;
  reasoning: string[];
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  factor: string;
  signal: "bullish" | "bearish" | "neutral";
  weight: number;
  description: string;
}

export class PriceAnalyticsService {
  private cacheProvider: CacheProvider;

  constructor(
    private store: DatabaseStore,
    cacheProvider?: CacheProvider,
  ) {
    this.cacheProvider = cacheProvider ?? cache;
  }

  /**
   * Compute comprehensive price analytics for a product.
   */
  async getAnalytics(productId: string): Promise<PriceAnalytics> {
    const cacheKey = CacheKeys.priceAnalytics(productId);
    const cached = await this.cacheProvider.get<PriceAnalytics>(cacheKey);
    if (cached) return cached;

    const history = await this.store.getHistoryForProduct(productId);
    const listings = await this.store.getListingsForProduct(productId);
    const prices = history.map((h) => h.price);

    const currentPrices = listings
      .filter((l) => l.lastPrice !== null && l.lastPrice > 0)
      .map((l) => l.lastPrice!);

    const currentPrice = currentPrices.length > 0
      ? Math.min(...currentPrices)
      : 0;

    const lowestPrice = prices.length > 0 ? Math.min(...prices) : currentPrice;
    const highestPrice = prices.length > 0 ? Math.max(...prices) : currentPrice;
    const averagePrice =
      prices.length > 0
        ? +(prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)
        : currentPrice;

    const sorted = [...prices].sort((a, b) => a - b);
    const medianPrice =
      sorted.length > 0
        ? sorted.length % 2 === 0
          ? +((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(2)
          : sorted[Math.floor(sorted.length / 2)]
        : currentPrice;

    const volatility = this.computeVolatility(prices);
    const { trend, trendStrength } = this.computeTrend(history);
    const priceChangePct =
      averagePrice > 0
        ? +(((currentPrice - averagePrice) / averagePrice) * 100).toFixed(1)
        : 0;

    const recentDrop = this.detectRecentDrop(history, listings);
    const storeRankings = this.computeStoreRankings(listings);

    const uniqueStores = new Set(listings.map((l) => l.platform));

    const analytics: PriceAnalytics = {
      productId,
      currentPrice,
      lowestPrice,
      highestPrice,
      averagePrice,
      medianPrice,
      volatility,
      priceChangePct,
      trend,
      trendStrength,
      recentDrop,
      storeRankings,
      dataPoints: prices.length,
      sources: uniqueStores.size,
      computedAt: new Date().toISOString(),
    };

    await this.cacheProvider.set(cacheKey, analytics, CacheTTL.ANALYTICS);
    return analytics;
  }

  /**
   * Generate a price prediction / buy recommendation.
   */
  async getPrediction(productId: string): Promise<PricePrediction> {
    const analytics = await this.getAnalytics(productId);
    const factors: PredictionFactor[] = [];

    // Factor 1: Price vs average
    const priceVsAvg = analytics.priceChangePct;
    if (priceVsAvg < -5) {
      factors.push({
        factor: "Price below average",
        signal: "bullish",
        weight: 0.3,
        description: `Current price is ${Math.abs(priceVsAvg)}% below the 30-day average`,
      });
    } else if (priceVsAvg > 5) {
      factors.push({
        factor: "Price above average",
        signal: "bearish",
        weight: 0.3,
        description: `Current price is ${priceVsAvg}% above the 30-day average`,
      });
    } else {
      factors.push({
        factor: "Price near average",
        signal: "neutral",
        weight: 0.15,
        description: `Current price is within 5% of the average`,
      });
    }

    // Factor 2: Trend
    if (analytics.trend === "down") {
      factors.push({
        factor: "Downward trend",
        signal: "bearish",
        weight: 0.25,
        description: `Prices have been trending down (strength: ${(analytics.trendStrength * 100).toFixed(0)}%)`,
      });
    } else if (analytics.trend === "up") {
      factors.push({
        factor: "Upward trend",
        signal: "bullish",
        weight: 0.2,
        description: "Prices have been trending up — buy now to avoid higher prices",
      });
    }

    // Factor 3: Proximity to all-time low
    if (analytics.lowestPrice > 0 && analytics.currentPrice > 0) {
      const aboveLow =
        ((analytics.currentPrice - analytics.lowestPrice) /
          analytics.lowestPrice) *
        100;
      if (aboveLow < 5) {
        factors.push({
          factor: "Near all-time low",
          signal: "bullish",
          weight: 0.25,
          description: `Only ${aboveLow.toFixed(1)}% above the all-time low of ₹${analytics.lowestPrice}`,
        });
      } else if (aboveLow > 20) {
        factors.push({
          factor: "Far from all-time low",
          signal: "bearish",
          weight: 0.15,
          description: `${aboveLow.toFixed(1)}% above the all-time low — potential room for a drop`,
        });
      }
    }

    // Factor 4: Volatility
    if (analytics.volatility > 10) {
      factors.push({
        factor: "High volatility",
        signal: "bearish",
        weight: 0.1,
        description:
          "Price fluctuates significantly — waiting may yield a better deal",
      });
    } else if (analytics.volatility < 3) {
      factors.push({
        factor: "Stable price",
        signal: "neutral",
        weight: 0.05,
        description: "Price has been stable — unlikely to drop significantly",
      });
    }

    // Factor 5: Recent drop
    if (analytics.recentDrop) {
      factors.push({
        factor: "Recent price drop",
        signal: "bullish",
        weight: 0.2,
        description: `Price dropped ${analytics.recentDrop.dropPercent.toFixed(1)}% recently at ${analytics.recentDrop.store}`,
      });
    }

    // Compute weighted recommendation
    let buyScore = 0;
    let totalWeight = 0;

    for (const factor of factors) {
      totalWeight += factor.weight;
      if (factor.signal === "bullish") buyScore += factor.weight;
      else if (factor.signal === "bearish") buyScore -= factor.weight * 0.7;
    }

    const normalizedScore = totalWeight > 0 ? buyScore / totalWeight : 0;
    const confidence = Math.min(95, Math.max(30, Math.abs(normalizedScore) * 100 + 40));

    let recommendation: "BUY" | "WAIT" | "NEUTRAL";
    if (normalizedScore > 0.2) recommendation = "BUY";
    else if (normalizedScore < -0.1) recommendation = "WAIT";
    else recommendation = "NEUTRAL";

    // Expected drop calculation
    let expectedDropPercent: number | null = null;
    let expectedDropAmount: number | null = null;
    if (
      recommendation === "WAIT" &&
      analytics.currentPrice > analytics.averagePrice
    ) {
      expectedDropPercent = +(
        ((analytics.currentPrice - analytics.averagePrice) /
          analytics.currentPrice) *
        100
      ).toFixed(1);
      expectedDropAmount = +(
        analytics.currentPrice - analytics.averagePrice
      ).toFixed(2);
    }

    const reasoning = factors
      .filter((f) => f.weight >= 0.15)
      .map((f) => f.description);

    return {
      recommendation,
      confidence: +confidence.toFixed(0),
      expectedDropPercent,
      expectedDropAmount,
      bestBuyWindow: recommendation === "WAIT" ? "Within 2–4 weeks" : null,
      reasoning,
      factors,
    };
  }

  // -----------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------

  private computeVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    if (mean === 0) return 0;
    const variance =
      prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) /
      prices.length;
    const stdDev = Math.sqrt(variance);
    return +((stdDev / mean) * 100).toFixed(2);
  }

  private computeTrend(
    history: Array<{ price: number; recordedAt: string }>,
  ): { trend: "up" | "down" | "stable"; trendStrength: number } {
    if (history.length < 4)
      return { trend: "stable", trendStrength: 0 };

    const sorted = [...history].sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );

    const mid = Math.floor(sorted.length / 2);
    const firstHalfAvg =
      sorted.slice(0, mid).reduce((s, h) => s + h.price, 0) / mid;
    const secondHalfAvg =
      sorted.slice(mid).reduce((s, h) => s + h.price, 0) /
      (sorted.length - mid);

    const diff = secondHalfAvg - firstHalfAvg;
    const avg = (firstHalfAvg + secondHalfAvg) / 2;
    const changePct = avg > 0 ? Math.abs(diff / avg) : 0;

    if (diff > avg * 0.02)
      return { trend: "up", trendStrength: Math.min(1, changePct * 5) };
    if (diff < -avg * 0.02)
      return { trend: "down", trendStrength: Math.min(1, changePct * 5) };
    return { trend: "stable", trendStrength: 0 };
  }

  private detectRecentDrop(
    history: Array<{
      price: number;
      recordedAt: string;
      listingId: string;
    }>,
    listings: Array<{
      id: string;
      platform: string;
      lastPrice: number | null;
    }>,
  ): PriceDrop | null {
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const recent = history
      .filter((h) => new Date(h.recordedAt).getTime() >= sevenDaysAgo)
      .sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
      );

    if (recent.length < 2) return null;

    // Find the biggest drop
    let maxDrop = 0;
    let dropFrom = 0;
    let dropTo = 0;
    let dropListingId = "";
    let dropTime = "";

    for (let i = 1; i < recent.length; i++) {
      const drop = recent[i - 1].price - recent[i].price;
      if (drop > maxDrop) {
        maxDrop = drop;
        dropFrom = recent[i - 1].price;
        dropTo = recent[i].price;
        dropListingId = recent[i].listingId;
        dropTime = recent[i].recordedAt;
      }
    }

    if (maxDrop <= 0 || dropFrom <= 0) return null;

    const listing = listings.find((l) => l.id === dropListingId);

    return {
      fromPrice: dropFrom,
      toPrice: dropTo,
      dropAmount: +maxDrop.toFixed(2),
      dropPercent: +((maxDrop / dropFrom) * 100).toFixed(1),
      store: listing?.platform || "Unknown",
      detectedAt: dropTime,
    };
  }

  private computeStoreRankings(
    listings: Array<{
      platform: string;
      lastPrice: number | null;
    }>,
  ): StoreRanking[] {
    const priced = listings
      .filter((l) => l.lastPrice !== null && l.lastPrice > 0)
      .sort((a, b) => a.lastPrice! - b.lastPrice!);

    if (priced.length === 0) return [];

    const lowest = priced[0].lastPrice!;

    return priced.map((l, idx) => ({
      store: l.platform,
      price: l.lastPrice!,
      rank: idx + 1,
      premiumPercent:
        lowest > 0
          ? +(((l.lastPrice! - lowest) / lowest) * 100).toFixed(1)
          : 0,
      isBestDeal: idx === 0,
    }));
  }
}
