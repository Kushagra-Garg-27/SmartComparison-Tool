import { apiClient } from "./apiClient";
import type { AffiliateClickParams } from "./types";

export const affiliateService = {
  trackClick: async (params: AffiliateClickParams): Promise<void> => {
    await apiClient.post("/products/affiliate/track", {
      listing_id: params.listingId,
      product_id: params.productId,
      store: params.store,
      affiliate_network: params.affiliateNetwork,
    });
  },
};
