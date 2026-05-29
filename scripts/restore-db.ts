/**
 * Restore DB from a JSON backup file.
 *
 * Usage:
 *   npx ts-node --esm --skip-project scripts/restore-db.ts backups/2026-05-28_prod.json
 *
 * WARNING: This DELETES all existing data and replaces it with the backup.
 * Only restores to the DB in .env.local (dev branch by default).
 */

import { readFileSync } from "fs";
import { Pool } from "@neondatabase/serverless";

const backupFile = process.argv[2];
if (!backupFile) {
  console.error("Usage: npx ts-node --esm --skip-project scripts/restore-db.ts <backup-file>");
  process.exit(1);
}

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}

const RESTORE_ORDER = [
  "users",
  "bonus_questions",
  "planilla_predictions",
  "planilla_comodines",
  "planilla_doubles",
  "bonus_predictions",
  "bonus_results",
  "match_results",
  "match_settings",
  "exact_score_predictions",
  "players",
];

async function main() {
  const backup = JSON.parse(readFileSync(backupFile, "utf-8"));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  console.log(`Restoring from ${backupFile}...`);
  console.log("⚠️  This will DELETE all existing data in the dev DB.\n");

  // Delete in reverse order (foreign keys)
  const deleteOrder = [...RESTORE_ORDER].reverse();
  for (const table of deleteOrder) {
    if (!backup[table]) continue;
    try {
      await pool.query(`DELETE FROM ${table}`);
      console.log(`  🗑 ${table}: cleared`);
    } catch {
      // Table might not exist
    }
  }

  // Insert in order (respecting foreign keys)
  for (const table of RESTORE_ORDER) {
    const rows = backup[table];
    if (!rows || rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    let inserted = 0;

    for (const row of rows) {
      const values = columns.map((col) => row[col]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
      const colNames = columns.join(", ");

      try {
        await pool.query(
          `INSERT INTO ${table} (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values,
        );
        inserted++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`  ✗ ${table} row failed: ${msg}`);
      }
    }

    console.log(`  ✓ ${table}: ${inserted}/${rows.length} rows restored`);
  }

  // Reset sequences
  for (const table of RESTORE_ORDER) {
    const rows = backup[table];
    if (!rows || rows.length === 0 || !rows[0].id) continue;

    try {
      const maxId = Math.max(...rows.map((r: Record<string, unknown>) => Number(r.id) || 0));
      await pool.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), $1, true)`, [maxId]);
    } catch {
      // Not all tables have serial IDs
    }
  }

  await pool.end();
  console.log("\n✅ Restore complete");
}

main().catch((err) => {
  console.error("Restore failed:", err);
  process.exit(1);
});
