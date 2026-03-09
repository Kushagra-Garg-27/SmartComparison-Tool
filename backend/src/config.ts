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
} as const;
