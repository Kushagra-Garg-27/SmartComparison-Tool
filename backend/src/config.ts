import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  host: process.env.HOST || "0.0.0.0",
  useMemoryStore: process.env.USE_MEMORY_STORE === "true",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/smartcompare",

  // Search Discovery
  searchApiKey: process.env.SEARCH_API_KEY || "",
  searchProvider: (process.env.SEARCH_PROVIDER || "serper") as
    | "serper"
    | "serpapi"
    | "brave",

  // Currency API
  exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY || "30b574699d3e89d55183c541",

  // Supabase JWT verification
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || "",

  // Gemini AI
  geminiApiKey: process.env.GEMINI_API_KEY || "",

  // Scraper Configuration
  scraperConcurrency: parseInt(process.env.SCRAPER_CONCURRENCY || "3", 10),
  scraperTimeoutMs: parseInt(process.env.SCRAPER_TIMEOUT_MS || "10000", 10),

  // Cache Configuration (TTLs in ms)
  cacheTtlListings: parseInt(process.env.CACHE_TTL_LISTINGS || String(10 * 60 * 1000), 10),
  cacheTtlSearch: parseInt(process.env.CACHE_TTL_SEARCH || String(5 * 60 * 1000), 10),
  cacheTtlAnalytics: parseInt(process.env.CACHE_TTL_ANALYTICS || String(15 * 60 * 1000), 10),

  // Upstash Redis (distributed caching)
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || "",
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || "",
} as const;
