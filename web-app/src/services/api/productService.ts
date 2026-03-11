import { apiClient } from "./apiClient";
import type { Product, ProductSearchResult } from "./types";

export const productService = {
  getById: async (id: string): Promise<Product> => {
    return apiClient.get<Product>(`/products/${encodeURIComponent(id)}`);
  },

  search: async (query: string, category: string): Promise<ProductSearchResult[]> => {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (category && category !== "all") params.category = category;
    return apiClient.get<ProductSearchResult[]>("/products/search", params);
  },

  getAll: async (category?: string, limit = 20): Promise<ProductSearchResult[]> => {
    const params: Record<string, string> = { limit: String(limit) };
    if (category && category !== "all") params.category = category;
    return apiClient.get<ProductSearchResult[]>("/products", params);
  },
};
