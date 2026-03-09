/**
 * Initialize the PostgreSQL database schema.
 * Run: npm run db:init
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getPool, closePool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function init() {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  const pool = getPool();

  console.log("[db:init] Running schema migration...");
  await pool.query(sql);
  console.log("[db:init] Schema created successfully.");

  await closePool();
}

init().catch((err) => {
  console.error("[db:init] Failed:", err);
  process.exit(1);
});
