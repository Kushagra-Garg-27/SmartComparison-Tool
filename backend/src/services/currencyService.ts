/**
 * Currency Service — Live Exchange Rate API Integration
 *
 * Fetches and caches live exchange rates to provide accurate cross-store
 * price comparisons globally.
 */

import { cache, CacheProvider } from "./cache.js";
import { config } from "../config.js";

// Cache for 12 hours to minimize API calls
const CACHE_TTL_RATES = 12 * 60 * 60 * 1000;
const CACHE_KEY = "exchange_rates:usd";

export interface ExchangeRateResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
  "error-type"?: string;
}

export class CurrencyService {
  private cacheProvider: CacheProvider;
  private apiKey: string;
  
  // Fallback rates (Base USD) in case the API is down completely on first run
  private fallbackRates: Record<string, number> = {
    USD: 1,
    INR: 83.3, 
    EUR: 0.92, 
    GBP: 0.79, 
    JPY: 149.2, 
    CAD: 1.35, 
    AUD: 1.53, 
  };

  constructor(cacheProvider: CacheProvider = cache) {
    this.cacheProvider = cacheProvider;
    this.apiKey = config.exchangeRateApiKey;
  }

  /**
   * Get exchange rate from one currency to another
   * Returns how many targetCurrency you get for 1 fromCurrency
   * e.g., getExchangeRate("INR", "USD") -> ~0.012
   */
  async getExchangeRate(fromCurrency: string, targetCurrency: string): Promise<number | null> {
    const from = fromCurrency.toUpperCase();
    const to = targetCurrency.toUpperCase();

    if (from === to) return 1;

    try {
      const rates = await this.getRatesWithCache();
      
      const fromRate = rates[from];
      const toRate = rates[to];
      
      if (!fromRate || !toRate) return null;
      
      // Since rates are based on 1 USD:
      // 1 USD = fromRate FROM
      // 1 USD = toRate TO
      // 1 FROM = (toRate / fromRate) TO
      return toRate / fromRate;
    } catch (err) {
      console.error("[CurrencyService] Failed to get exchange rate:", err);
      // Fallback to static rates if possible
      const fromRate = this.fallbackRates[from];
      const toRate = this.fallbackRates[to];
      if (fromRate && toRate) return toRate / fromRate;
      return null; // Return null if unsupported currency and API failed
    }
  }

  private async getRatesWithCache(): Promise<Record<string, number>> {
    const cachedArgs = await this.cacheProvider.get<Record<string, number>>(CACHE_KEY);
    if (cachedArgs) return cachedArgs;

    const rates = await this.fetchRatesFromAPI();
    await this.cacheProvider.set(CACHE_KEY, rates, CACHE_TTL_RATES);
    return rates;
  }

  private async fetchRatesFromAPI(): Promise<Record<string, number>> {
    const url = `https://v6.exchangerate-api.com/v6/${this.apiKey}/latest/USD`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`ExchangeRate-API responded with status: ${response.status}`);
    }

    const data = (await response.json()) as ExchangeRateResponse;
    if (data.result !== "success") {
      throw new Error(`ExchangeRate-API error: ${data["error-type"] || "Unknown"}`);
    }

    return data.conversion_rates;
  }
}

export const currencyService = new CurrencyService();
