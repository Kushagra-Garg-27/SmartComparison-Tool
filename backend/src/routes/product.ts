/**
 * Product API routes.
 *
 * POST /api/product/identify  — Resolve detected product → canonical + listings
 * POST /api/product/compare   — Get cross-platform comparison
 * GET  /api/product/history   — Get price history for charts
 */

import { FastifyInstance } from "fastify";
import { ProductService } from "../services/productService.js";
import type { DetectedProductInput } from "../types.js";

export async function productRoutes(
  fastify: FastifyInstance,
  opts: { productService: ProductService },
) {
  const { productService } = opts;

  // --- POST /api/product/identify ---
  fastify.post<{ Body: DetectedProductInput }>(
    "/api/product/identify",
    {
      schema: {
        body: {
          type: "object",
          required: ["title", "currency", "platform", "url"],
          properties: {
            title: { type: "string" },
            price: { type: ["number", "null"] },
            currency: { type: "string" },
            platform: { type: "string" },
            externalId: { type: ["string", "null"] },
            gtin: { type: ["string", "null"] },
            brand: { type: ["string", "null"] },
            image: { type: ["string", "null"] },
            url: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await productService.identify(request.body);
      return reply.send(result);
    },
  );

  // --- POST /api/product/compare ---
  fastify.post<{ Body: { productId: string; currentPlatform?: string } }>(
    "/api/product/compare",
    {
      schema: {
        body: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: { type: "string" },
            currentPlatform: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { productId, currentPlatform } = request.body;
      const result = await productService.compare(productId, currentPlatform);
      return reply.send(result);
    },
  );

  // --- GET /api/product/history ---
  fastify.get<{ Querystring: { productId: string } }>(
    "/api/product/history",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { productId } = request.query;
      const result = await productService.getHistory(productId);
      return reply.send(result);
    },
  );
}
