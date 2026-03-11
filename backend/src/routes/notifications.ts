/**
 * Notification routes (frontend-compatible).
 *
 * GET  /notifications              — Get user's notifications
 * GET  /notifications/alerts/count — Get triggered alert count
 * POST /notifications/:id/read     — Mark single notification as read
 * POST /notifications/read-all     — Mark multiple notifications as read
 */

import { FastifyInstance } from "fastify";
import { DatabaseStore } from "../store/databaseStore.js";
import { requireAuth } from "../middleware/auth.js";
import type { FrontendNotification } from "../types.js";

export async function notificationRoutes(
  fastify: FastifyInstance,
  opts: { store: DatabaseStore },
) {
  const { store } = opts;

  // --- GET /notifications/alerts/count ---
  // Registered BEFORE the parameterized route to avoid conflict
  fastify.get(
    "/notifications/alerts/count",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.id;
      const count = await store.getTriggeredAlertCount(userId);
      return reply.send({ count });
    },
  );

  // --- POST /notifications/read-all ---
  // Registered BEFORE the parameterized route to avoid conflict
  fastify.post<{ Body: { ids: string[] } }>(
    "/notifications/read-all",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { ids } = request.body;
      await store.markAllNotificationsRead(ids);
      return reply.status(204).send();
    },
  );

  // --- GET /notifications ---
  fastify.get<{ Querystring: { limit?: string } }>(
    "/notifications",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = request.user!.id;
      const limit = request.query.limit
        ? parseInt(request.query.limit, 10)
        : 20;

      const notifications = await store.getNotificationsByUser(userId, limit);

      const results: FrontendNotification[] = notifications.map((n) => ({
        id: n.id,
        user_id: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        read: n.read,
        link: n.link,
        created_at: n.createdAt,
      }));

      return reply.send(results);
    },
  );

  // --- POST /notifications/:id/read ---
  fastify.post<{ Params: { id: string } }>(
    "/notifications/:id/read",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const success = await store.markNotificationRead(request.params.id);
      if (!success) {
        return reply.status(404).send({ error: "Notification not found" });
      }
      return reply.status(204).send();
    },
  );
}
