/**
 * Seed the database with sample product data.
 * Run: npm run db:seed
 *
 * This can work with either PostgreSQL or the in-memory store
 * depending on environment config.
 */
import { MemoryStore } from "../store/memoryStore.js";

/**
 * Populates the in-memory store with structured placeholder data.
 * In a real deployment, this would insert into PostgreSQL.
 */
export function seedMemoryStore(store: MemoryStore): void {
  // --- Sellers ---
  const sellers = [
    {
      id: "seller-amazon",
      name: "Amazon.com",
      platform: "Amazon",
      trustScore: 96,
    },
    {
      id: "seller-bestbuy",
      name: "Best Buy",
      platform: "BestBuy",
      trustScore: 94,
    },
    {
      id: "seller-walmart",
      name: "Walmart.com",
      platform: "Walmart",
      trustScore: 92,
    },
    {
      id: "seller-ebay-top",
      name: "TopRatedSeller",
      platform: "eBay",
      trustScore: 88,
    },
    {
      id: "seller-flipkart",
      name: "Flipkart",
      platform: "Flipkart",
      trustScore: 90,
    },
    {
      id: "seller-apple",
      name: "Apple Store",
      platform: "Direct",
      trustScore: 99,
    },
  ];
  sellers.forEach((s) => store.addSeller(s));

  // Seed data is intentionally minimal — the identify endpoint
  // dynamically creates products from detection data when no match exists.
  console.log(`[seed] Loaded ${sellers.length} sellers into memory store.`);
}
