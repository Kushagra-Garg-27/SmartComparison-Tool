import { apiClient } from "./apiClient";
import type { PriceHistoryPoint } from "./types";

export const priceHistoryService = {
  getByProductId: async (productId: string, limit = 90): Promise<PriceHistoryPoint[]> => {
    return apiClient.get<PriceHistoryPoint[]>(
      `/price-history/${encodeURIComponent(productId)}`,
      { limit: String(limit) }
    );
  },
};
