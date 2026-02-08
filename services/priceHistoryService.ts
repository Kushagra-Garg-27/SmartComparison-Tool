import { PricePoint, Product } from '../types';

const STORAGE_KEY = 'smartcompare_price_history_v1';

/**
 * Simulates a backend database for price history.
 * In a real app, this would fetch from an API / Time-series DB.
 */
export const PriceHistoryService = {
  
  /**
   * Retrieves history for a specific product ID.
   */
  getHistory: (productId: string): PricePoint[] => {
    try {
      const allHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return allHistory[productId] || [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  },

  /**
   * Adds a single verified price point.
   */
  addPricePoint: (productId: string, price: number, vendor: string) => {
    try {
      const allHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const productHistory = allHistory[productId] || [];
      
      const newPoint: PricePoint = {
        timestamp: Date.now(),
        price,
        vendor
      };

      // Simple dedup: don't add if the last point was < 1 hour ago
      const lastPoint = productHistory[productHistory.length - 1];
      if (lastPoint && (newPoint.timestamp - lastPoint.timestamp) < 3600000) {
        return; 
      }

      productHistory.push(newPoint);
      
      // Sort by time just in case
      productHistory.sort((a: PricePoint, b: PricePoint) => a.timestamp - b.timestamp);

      allHistory[productId] = productHistory;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allHistory));
    } catch (e) {
      console.error("Failed to save price point", e);
    }
  },

  /**
   * SEED DATA GENERATOR
   * Since this is a demo, we need "fake" history to make the graph look good immediately.
   * This generates a realistic volatility curve ending at the current price.
   */
  seedMockHistory: (products: Product[]) => {
    try {
      const allHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      let hasChanges = false;

      products.forEach(p => {
        if (!allHistory[p.id] || allHistory[p.id].length < 5) {
          // Generate 30 days of history
          const history: PricePoint[] = [];
          const now = Date.now();
          const dayMs = 86400000;
          let currentSimPrice = p.price;

          // Work backwards from current price
          for (let i = 30; i >= 0; i--) {
            // Add some noise/volatility
            const volatility = p.price * 0.05; // 5% swing capability
            const change = (Math.random() * volatility) - (volatility / 2);
            
            // Bias towards slightly higher past prices (simulating a drop/deal) if it's a "deal"
            // or stable if it's standard.
            
            let price = i === 0 ? p.price : currentSimPrice + change;
            
            // Ensure positive price
            price = Math.max(price, p.price * 0.5); 
            
            history.unshift({
              timestamp: now - (i * dayMs),
              price: Number(price.toFixed(2)),
              vendor: p.vendor
            });
            
            currentSimPrice = price;
          }

          allHistory[p.id] = history;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allHistory));
      }
    } catch (e) {
      console.error("Failed to seed history", e);
    }
  }
};
