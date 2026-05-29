/**
 * Backup all DB tables to a JSON file.
 *
 * Usage:
 *   npx ts-node --esm --skip-project scripts/backup-db.ts
 *   npx ts-node --esm --skip-project scripts/backup-db.ts --prod  # backup prod DB
 *
 * Output: backups/YYYY-MM-DD_HHmmss.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { Pool } from "@neondatabase/serverless";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}

const isProd = process.argv.includes("--prod");
const PROD_URL = "postgresql://neondb_owner:npg_L8Rxn4zFaXMC@ep-red-bonus-apk4gvsr-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

const TABLES = [
  "users",
  "planilla_predictions",
  "planilla_comodines",
  "planilla_doubles",
  "bonus_predictions",
  "bonus_questions",
  "bonus_results",
  "match_results",
  "match_settings",
  "exact_score_predictions",
  "players",
];

async function main() {
  const dbUrl = isProd ? PROD_URL : process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString: dbUrl });

  console.log(`Backing up ${isProd ? "PROD" : "DEV"} database...`);

  const backup: Record<string, unknown[]> = {};

  for (const table of TABLES) {
    try {
      const { rows } = await pool.query(`SELECT * FROM ${table}`);
      backup[table] = rows;
      console.log(`  ✓ ${table}: ${rows.length} rows`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("does not exist")) {
        console.log(`  - ${table}: not found (skipped)`);
      } else {
        console.error(`  ✗ ${table}: ${msg}`);
      }
    }
  }

  await pool.end();

  const now = new Date();
  const timestamp = now.toISOString().replace(/[T:]/g, "_").replace(/\..+/, "");
  const filename = `backups/${timestamp}${isProd ? "_prod" : "_dev"}.json`;

  mkdirSync("backups", { recursive: true });
  writeFileSync(filename, JSON.stringify(backup, null, 2));

  const totalRows = Object.values(backup).reduce((sum, rows) => sum + rows.length, 0);
  console.log(`\n✅ Backup saved to ${filename} (${totalRows} total rows)`);
}

main().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
