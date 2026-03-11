import { apiClient } from "./apiClient";
import type { ProductListing } from "./types";

export const listingService = {
  getByProductId: async (productId: string): Promise<ProductListing[]> => {
    return apiClient.get<ProductListing[]>(
      `/products/${encodeURIComponent(productId)}/listings`
    );
  },
};
