/**
 * Frontend-compatible product routes.
 *
 * GET  /products/search    — Search products
 * GET  /products/:id       — Get product by ID
 * GET  /products           — List all products
 * GET  /products/:id/listings — Get listings for a product
 * POST /products/affiliate/track — Track affiliate click
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { DatabaseStore } from "../store/databaseStore.js";
import { requireAuth } from "../middleware/auth.js";
import type {
  FrontendProduct,
  FrontendProductSearchResult,
  FrontendProductListing,
} from "../types.js";

export async function frontendProductRoutes(
  fastify: FastifyInstance,
  opts: { store: DatabaseStore },
) {
  const { store } = opts;

  // --- GET /products/search ---
  fastify.get<{ Querystring: { q?: string; category?: string } }>(
    "/products/search",
    async (request, reply) => {
      const { q, category } = request.query;
      const products = q
        ? await store.searchProducts(q, category)
        : await store.getAllProducts(category, 50);

      const results: FrontendProductSearchResult[] = products.map((p, idx) => ({
        id: p.id,
        name: p.canonicalTitle,
        brand: p.brand,
        category: p.category,
        image_url: p.image,
        similarity: q ? Math.max(0.5, 1 - idx * 0.05) : 1,
      }));

      return reply.send(results);
    },
  );

  // --- GET /products/:id ---
  fastify.get<{ Params: { id: string } }>(
    "/products/:id",
    async (request, reply) => {
      const product = await store.getProductById(request.params.id);
      if (!product) {
        return reply.status(404).send({ error: "Product not found" });
      }

      const result: FrontendProduct = {
        id: product.id,
        name: product.canonicalTitle,
        brand: product.brand,
        category: product.category,
        subcategory: product.subcategory,
        image_url: product.image,
        specs: product.specs,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      };

      return reply.send(result);
    },
  );

  // --- GET /products ---
  fastify.get<{ Querystring: { limit?: string; category?: string } }>(
    "/products",
    async (request, reply) => {
      const limit = request.query.limit
        ? parseInt(request.query.limit, 10)
        : 20;
      const { category } = request.query;
      const products = await store.getAllProducts(category, limit);

      const results: FrontendProductSearchResult[] = products.map((p) => ({
        id: p.id,
        name: p.canonicalTitle,
        brand: p.brand,
        category: p.category,
        image_url: p.image,
        similarity: 1,
      }));

      return reply.send(results);
    },
  );

  // --- GET /products/:id/listings ---
  fastify.get<{ Params: { id: string } }>(
    "/products/:id/listings",
    async (request, reply) => {
      const listings = await store.getListingsForProduct(request.params.id);

      const results: FrontendProductListing[] = [];
      for (const l of listings) {
        const seller = l.sellerId ? await store.getSellerById(l.sellerId) : null;
        results.push({
          id: l.id,
          product_id: l.productId,
          store: l.platform,
          current_price: l.lastPrice ?? 0,
          original_price: l.originalPrice,
          seller_name: seller?.name || l.platform,
          seller_rating: seller?.trustScore ?? null,
          store_url: l.url,
          affiliate_url: l.affiliateUrl,
          affiliate_network: l.affiliateNetwork,
          is_available: l.inStock,
          last_checked_at: l.lastChecked,
          created_at: l.createdAt,
          updated_at: l.updatedAt,
        });
      }

      return reply.send(results);
    },
  );

  // --- POST /products/affiliate/track ---
  fastify.post<{
    Body: {
      listing_id: string;
      product_id: string;
      store: string;
      affiliate_network: string | null;
    };
  }>(
    "/products/affiliate/track",
    async (request, reply) => {
      const { listing_id, product_id, store: storeName, affiliate_network } =
        request.body;

      await store.addAffiliateClick({
        userId: request.user?.id || null,
        listingId: listing_id,
        productId: product_id,
        store: storeName,
        affiliateNetwork: affiliate_network,
      });

      return reply.status(204).send();
    },
  );
}
