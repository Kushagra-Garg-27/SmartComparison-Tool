/**
 * Deal routes (frontend-compatible).
 *
 * GET /deals — Get all deals (with optional limit)
 */

import { FastifyInstance } from "fastify";
import { DatabaseStore } from "../store/databaseStore.js";
import type { FrontendDeal } from "../types.js";

export async function dealRoutes(
  fastify: FastifyInstance,
  opts: { store: DatabaseStore },
) {
  const { store } = opts;

  // --- GET /deals ---
  fastify.get<{ Querystring: { limit?: string } }>(
    "/deals",
    async (request, reply) => {
      const limit = request.query.limit
        ? parseInt(request.query.limit, 10)
        : undefined;

      const deals = await store.getAllDeals(limit);

      const results: FrontendDeal[] = deals.map((d) => ({
        id: d.id,
        product_id: d.productId,
        product_name: d.productName,
        product_image: d.productImage,
        original_price: d.originalPrice,
        deal_price: d.dealPrice,
        discount_percent: d.discountPercent,
        deal_score: d.dealScore,
        store: d.store,
        category: d.category,
        is_limited_time: d.isLimitedTime,
        expires_at: d.expiresAt,
        created_at: d.createdAt,
      }));

      return reply.send(results);
    },
  );
}
