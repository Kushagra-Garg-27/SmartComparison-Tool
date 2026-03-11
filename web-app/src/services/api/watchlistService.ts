import { apiClient } from "./apiClient";
import type { WatchlistItem } from "./types";

export const watchlistService = {
  getByUserId: async (userId: string, limit?: number): Promise<WatchlistItem[]> => {
    const params: Record<string, string> = {};
    if (limit) params.limit = String(limit);
    return apiClient.get<WatchlistItem[]>("/watchlist", params);
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/watchlist/${encodeURIComponent(id)}`);
  },
};
