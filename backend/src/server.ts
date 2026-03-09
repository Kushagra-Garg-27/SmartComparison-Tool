/**
 * SmartCompare Backend — Fastify Server Entry Point
 *
 * Starts the API server that powers the SmartCompare browser extension.
 * By default uses an in-memory store (no database required for dev).
 * Set USE_MEMORY_STORE=false and provide DATABASE_URL to use PostgreSQL.
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { MemoryStore } from "./store/memoryStore.js";
import { ProductService } from "./services/productService.js";
import { productRoutes } from "./routes/product.js";
import { healthRoutes } from "./routes/health.js";
import { seedMemoryStore } from "./db/seed.js";

async function main() {
  const fastify = Fastify({
    logger: true,
  });

  // --- CORS (allow extension origin) ---
  await fastify.register(cors, {
    origin: true, // Allow all origins in dev (extension runs from chrome-extension://)
    methods: ["GET", "POST", "OPTIONS"],
  });

  // --- Data Layer ---
  let productService: ProductService;

  if (config.useMemoryStore) {
    const store = new MemoryStore();
    seedMemoryStore(store);
    productService = new ProductService(store);
    fastify.log.info("Using in-memory data store");
  } else {
    // PostgreSQL mode — still use MemoryStore as fallback for now
    // TODO: Implement PostgreSQL-backed service
    const store = new MemoryStore();
    seedMemoryStore(store);
    productService = new ProductService(store);
    fastify.log.warn(
      "PostgreSQL mode not yet implemented — falling back to memory store",
    );
  }

  // --- Routes ---
  await fastify.register(healthRoutes);
  await fastify.register(productRoutes, { productService });

  // --- Start ---
  try {
    await fastify.listen({ port: config.port, host: config.host });
    fastify.log.info(
      `SmartCompare Backend running at http://${config.host}:${config.port}`,
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    fastify.log.info("Shutting down...");
    await fastify.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
