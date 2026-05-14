/**
 * Set up the database schema for Produsa.
 *
 * Run with: npx ts-node --esm --skip-project scripts/setup-db.ts
 *
 * Requires DATABASE_URL in environment or .env.local
 */

import { readFileSync } from "fs";

// Parse .env.local manually (no dotenv dependency)
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}

async function main() {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Creating tables...\n");

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      invite_code VARCHAR(50) UNIQUE NOT NULL,
      pin VARCHAR(255) NOT NULL,
      avatar VARCHAR(10) DEFAULT '⚽',
      is_admin BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("  ✓ users");

  await sql`
    CREATE TABLE IF NOT EXISTS planilla_predictions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      match_id VARCHAR(20) NOT NULL,
      outcome VARCHAR(2) NOT NULL CHECK (outcome IN ('L', 'E', 'V', 'LE', 'EV', 'LV')),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, match_id)
    )
  `;
  console.log("  ✓ planilla_predictions");

  await sql`
    CREATE TABLE IF NOT EXISTS planilla_comodines (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      scope VARCHAR(20) NOT NULL,
      match_id VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, scope)
    )
  `;
  console.log("  ✓ planilla_comodines");

  await sql`
    CREATE TABLE IF NOT EXISTS planilla_doubles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      fecha INTEGER NOT NULL CHECK (fecha IN (1, 2, 3)),
      match_id VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, fecha)
    )
  `;
  console.log("  ✓ planilla_doubles");

  await sql`
    CREATE TABLE IF NOT EXISTS bonus_predictions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      question_id VARCHAR(50) NOT NULL,
      answer VARCHAR(200) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, question_id)
    )
  `;
  console.log("  ✓ bonus_predictions");

  await sql`
    CREATE TABLE IF NOT EXISTS match_results (
      match_id VARCHAR(20) PRIMARY KEY,
      home_score INTEGER NOT NULL,
      away_score INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log("  ✓ match_results");

  await sql`
    CREATE TABLE IF NOT EXISTS lock_deadlines (
      id SERIAL PRIMARY KEY,
      scope VARCHAR(20) UNIQUE NOT NULL,
      locks_at TIMESTAMP NOT NULL
    )
  `;
  console.log("  ✓ lock_deadlines");

  // Seed lock deadlines from match data
  // Group stage: earliest kickoff per matchday
  // Knockout: earliest kickoff per round
  const deadlines = [
    { scope: "fecha-1", locks_at: "2026-06-11T17:00:00Z" },
    { scope: "fecha-2", locks_at: "2026-06-15T16:00:00Z" },
    { scope: "fecha-3", locks_at: "2026-06-19T17:00:00Z" },
    { scope: "R32", locks_at: "2026-06-28T19:00:00Z" },
    { scope: "R16", locks_at: "2026-07-04T17:00:00Z" },
    { scope: "QF", locks_at: "2026-07-09T20:00:00Z" },
    { scope: "SF", locks_at: "2026-07-14T19:00:00Z" },
    { scope: "FINAL", locks_at: "2026-07-18T21:00:00Z" },
  ];

  for (const d of deadlines) {
    await sql`
      INSERT INTO lock_deadlines (scope, locks_at)
      VALUES (${d.scope}, ${d.locks_at})
      ON CONFLICT (scope) DO UPDATE SET locks_at = ${d.locks_at}
    `;
  }
  console.log("  ✓ lock_deadlines (seeded)");

  console.log("\n✅ Database setup complete!");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
