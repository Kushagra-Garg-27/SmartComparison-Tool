import { apiClient } from "./apiClient";
import type { Deal } from "./types";

export const dealService = {
  getAll: async (): Promise<Deal[]> => {
    return apiClient.get<Deal[]>("/deals");
  },

  getRecent: async (limit: number): Promise<Deal[]> => {
    return apiClient.get<Deal[]>("/deals", { limit: String(limit) });
  },
};
