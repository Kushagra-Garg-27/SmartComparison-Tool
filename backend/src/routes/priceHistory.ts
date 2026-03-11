/**
 * Price history routes (frontend-compatible).
 *
 * GET /price-history/:productId — Get price history for a product
 */

import { FastifyInstance } from "fastify";
import { DatabaseStore } from "../store/databaseStore.js";
import type { FrontendPriceHistoryPoint } from "../types.js";

export async function priceHistoryRoutes(
  fastify: FastifyInstance,
  opts: { store: DatabaseStore },
) {
  const { store } = opts;

  // --- GET /price-history/:productId ---
  fastify.get<{ Params: { productId: string }; Querystring: { limit?: string } }>(
    "/price-history/:productId",
    async (request, reply) => {
      const { productId } = request.params;
      const limit = request.query.limit
        ? parseInt(request.query.limit, 10)
        : 90;

      const history = await store.getHistoryForProduct(productId);

      // Take only the last N points
      const trimmed = history.slice(-limit);

      const results: FrontendPriceHistoryPoint[] = trimmed.map((h) => ({
        id: h.id,
        product_id: h.productId || productId,
        listing_id: h.listingId,
        price: h.price,
        recorded_at: h.recordedAt,
      }));

      return reply.send(results);
    },
  );
}
