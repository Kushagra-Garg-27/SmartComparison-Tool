/**
 * Watchlist routes (frontend-compatible).
 *
 * GET    /watchlist     — Get user's watchlist items
 * DELETE /watchlist/:id — Remove item from watchlist
 */

import { FastifyInstance } from "fastify";
import { DatabaseStore } from "../store/databaseStore.js";
import { requireAuth } from "../middleware/auth.js";
import type { FrontendWatchlistItem } from "../types.js";

export async function watchlistRoutes(
  fastify: FastifyInstance,
  opts: { store: DatabaseStore },
) {
  const { store } = opts;

  // --- GET /watchlist ---
  fastify.get<{ Querystring: { limit?: string } }>(
    "/watchlist",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.id;
      const limit = request.query.limit
        ? parseInt(request.query.limit, 10)
        : undefined;

      const items = await store.getWatchlistByUser(userId, limit);

      const results: FrontendWatchlistItem[] = items.map((w) => ({
        id: w.id,
        user_id: w.userId,
        product_name: w.productName,
        product_image: w.productImage,
        product_url: w.productUrl,
        store: w.store,
        current_price: w.currentPrice,
        alert_price: w.alertPrice,
        trend: w.trend,
        created_at: w.createdAt,
        updated_at: w.updatedAt,
      }));

      return reply.send(results);
    },
  );

  // --- DELETE /watchlist/:id ---
  fastify.delete<{ Params: { id: string } }>(
    "/watchlist/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const removed = await store.removeWatchlistItem(request.params.id);
      if (!removed) {
        return reply.status(404).send({ error: "Watchlist item not found" });
      }
      return reply.status(204).send();
    },
  );
}
