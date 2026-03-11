import { apiClient } from "./apiClient";
import type {
  AnalyticsData,
  AIRecommendation,
  EnhancedProductResponse,
  StoreInfo,
} from "./types";

export const intelligenceService = {
  /** Full identify + analytics + recommendation in one call */
  identify: async (product: {
    title: string;
    price: number | null;
    currency: string;
    platform: string;
    url: string;
    externalId?: string | null;
    gtin?: string | null;
    brand?: string | null;
    image?: string | null;
  }): Promise<EnhancedProductResponse> => {
    return apiClient.post<EnhancedProductResponse>("/api/product/identify", product);
  },

  /** Standalone analytics for a known product */
  getAnalytics: async (productId: string): Promise<AnalyticsData> => {
    return apiClient.get<AnalyticsData>("/api/product/analytics", { productId });
  },

  /** Standalone AI recommendation for a known product */
  getRecommendation: async (productId: string): Promise<AIRecommendation> => {
    return apiClient.get<AIRecommendation>("/api/product/recommendation", { productId });
  },

  /** List all supported stores */
  getStores: async (): Promise<StoreInfo[]> => {
    return apiClient.get<StoreInfo[]>("/api/product/stores");
  },
};
