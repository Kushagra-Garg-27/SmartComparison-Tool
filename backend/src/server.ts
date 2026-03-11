/**
 * SmartCompare Backend — Fastify Server Entry Point
 *
 * Enterprise-grade price intelligence system powering:
 * - The SmartCompare Chrome extension (product detection + comparison)
 * - The SmartCompare SaaS web application (full product intelligence)
 *
 * Architecture:
 * - Store Registry: Dynamic store configuration
 * - Scraper Manager: Modular scrapers for each store
 * - Price Aggregator: Central orchestration engine
 * - Price Analytics: Statistical analysis and predictions
 * - AI Intelligence: Buy/wait recommendations
 * - Cache Layer: Intelligent caching with TTL (Redis or in-memory)
 *
 * Uses PostgreSQL (Neon) + Redis (Upstash) for production.
 * Set USE_MEMORY_STORE=true to fall back to in-memory store for local dev.
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import { DatabaseStore } from "./store/databaseStore.js";
import { MemoryStore } from "./store/memoryStore.js";
import { PriceAggregatorService } from "./services/priceAggregator.js";
import { PriceAnalyticsService } from "./services/priceAnalytics.js";
import { AIIntelligenceService } from "./services/aiIntelligence.js";
import { ScraperManager } from "./scrapers/index.js";
import { cache } from "./services/cache.js";
import { productRoutes } from "./routes/product.js";
import { healthRoutes } from "./routes/health.js";
import { frontendProductRoutes } from "./routes/frontendProducts.js";
import { priceHistoryRoutes } from "./routes/priceHistory.js";
import { dealRoutes } from "./routes/deals.js";
import { watchlistRoutes } from "./routes/watchlist.js";
import { notificationRoutes } from "./routes/notifications.js";
import { chatRoutes } from "./routes/chat.js";
import { authMiddleware } from "./middleware/auth.js";
import { seedMemoryStore } from "./db/seed.js";
import { storeRegistry } from "./stores/registry.js";

async function main() {
  const fastify = Fastify({
    logger: true,
  });

  // --- Handle empty JSON body gracefully ---
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_req, body, done) => {
      const str = (body as string).trim();
      if (!str) {
        done(null, undefined);
        return;
      }
      try {
        done(null, JSON.parse(str));
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  // --- CORS (allow extension + frontend origins) ---
  await fastify.register(cors, {
    origin: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
  });

  // --- Auth middleware (runs on every request, attaches user) ---
  fastify.addHook("onRequest", authMiddleware);

  // --- Data Layer ---
  let store: DatabaseStore | MemoryStore;

  if (config.useMemoryStore) {
    fastify.log.info("Using in-memory store (development mode)");
    const memStore = new MemoryStore();
    seedMemoryStore(memStore);
    store = memStore;
  } else {
    fastify.log.info("Using PostgreSQL (Neon) + Redis (Upstash) — production mode");
    store = new DatabaseStore();
  }

  // --- Service Layer ---
  const scraperManager = new ScraperManager(config.scraperConcurrency);
  const aggregator = new PriceAggregatorService(store as any, scraperManager, cache);
  const analyticsService = new PriceAnalyticsService(store as any, cache);
  const aiIntelligence = new AIIntelligenceService(cache);

  // Log registered stores and scrapers
  const enabledStores = storeRegistry.getEnabled();
  const registeredScrapers = scraperManager.getRegisteredStores();
  fastify.log.info(
    `Stores: ${enabledStores.length} enabled (${enabledStores.map((s) => s.displayName).join(", ")})`,
  );
  fastify.log.info(
    `Scrapers: ${registeredScrapers.length} registered (${registeredScrapers.join(", ")})`,
  );

  // --- Extension API routes ---
  await fastify.register(healthRoutes);
  await fastify.register(productRoutes, {
    aggregator,
    analytics: analyticsService,
    aiIntelligence,
  });

  // --- Frontend-compatible routes ---
  await fastify.register(frontendProductRoutes, { store: store as any });
  await fastify.register(priceHistoryRoutes, { store: store as any });
  await fastify.register(dealRoutes, { store: store as any });
  await fastify.register(watchlistRoutes, { store: store as any });
  await fastify.register(notificationRoutes, { store: store as any });
  await fastify.register(chatRoutes);

  // --- Start ---
  try {
    await fastify.listen({ port: config.port, host: config.host });
    fastify.log.info(
      `SmartCompare Backend running at http://${config.host}:${config.port}`,
    );
    fastify.log.info(`Architecture: Store Registry → Scrapers → Aggregator → Analytics → AI`);
    fastify.log.info(`Data Layer: ${config.useMemoryStore ? "In-Memory" : "PostgreSQL + Redis"}`);
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
