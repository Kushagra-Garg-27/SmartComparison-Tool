export const queryKeys = {
  products: {
    all: ["products"] as const,
    detail: (id: string) => ["products", id] as const,
    search: (query: string, category: string) => ["products", "search", query, category] as const,
  },
  listings: {
    byProduct: (productId: string) => ["listings", productId] as const,
  },
  priceHistory: {
    byProduct: (productId: string) => ["price-history", productId] as const,
  },
  deals: {
    all: ["deals"] as const,
    recent: (limit: number) => ["deals", "recent", limit] as const,
    radar: ["deals", "radar"] as const,
  },
  watchlist: {
    byUser: (userId: string) => ["watchlist", userId] as const,
  },
  alerts: {
    countByUser: (userId: string) => ["alerts", "count", userId] as const,
  },
  notifications: {
    byUser: (userId: string) => ["notifications", userId] as const,
  },
  chat: {
    byProduct: (productId: string) => ["chat", productId] as const,
  },
  intelligence: {
    analytics: (productId: string) => ["intelligence", "analytics", productId] as const,
    recommendation: (productId: string) => ["intelligence", "recommendation", productId] as const,
    stores: ["intelligence", "stores"] as const,
  },
} as const;
