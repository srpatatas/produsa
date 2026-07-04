/**
 * Run a SQL migration on the dev or prod database.
 *
 * Usage:
 *   node scripts/run-migration.mjs scripts/migrations/001-bonus-scored.sql
 *   node scripts/run-migration.mjs scripts/migrations/001-bonus-scored.sql --prod
 */

import { readFileSync } from "fs";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Usage: node scripts/run-migration.mjs <sql-file> [--prod]");
  process.exit(1);
}

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}

const isProd = process.argv.includes("--prod");
const dbUrl = isProd ? process.env.PROD_DATABASE_URL : process.env.DATABASE_URL;

if (isProd && !process.env.PROD_DATABASE_URL) {
  console.error("PROD_DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sqlContent = readFileSync(sqlFile, "utf-8")
  .split("\n")
  .filter((l) => !l.startsWith("--") && l.trim())
  .join("\n")
  .trim();

if (!sqlContent) {
  console.error("Migration file is empty");
  process.exit(1);
}

console.log(`Running migration on ${isProd ? "PROD" : "DEV"} database...`);
console.log(`File: ${sqlFile}`);
console.log(`SQL: ${sqlContent}\n`);

const pool = new Pool({ connectionString: dbUrl });

try {
  const res = await pool.query(sqlContent);
  console.log(`✓ Migration complete: ${res.command}`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`✗ Migration failed: ${msg}`);
  process.exit(1);
} finally {
  await pool.end();
}
