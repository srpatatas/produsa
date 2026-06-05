/**
 * Seed the "primer-prode" and "ultimo-prode" bonus questions.
 *
 * Run with: npx ts-node --esm --skip-project scripts/seed-prode-bonus.ts
 */

import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}

const questions = [
  {
    id: "primer-prode",
    label: "Campeón de Produsa",
    subtitle: "¿Quién va a ganar el prode? No podés elegirte a vos mismo.",
    points: 5,
    source_type: "participants",
    lock_scope: "fecha-1",
  },
  {
    id: "ultimo-prode",
    label: "Último puesto Produsa",
    subtitle: "¿Quién va a salir último? No podés elegirte a vos mismo.",
    points: 5,
    source_type: "participants",
    lock_scope: "fecha-1",
  },
];

async function main() {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);

  for (const q of questions) {
    const maxSort = await sql`SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM bonus_questions WHERE lock_scope = ${q.lock_scope}`;
    const sortOrder = maxSort[0].next as number;

    await sql`
      INSERT INTO bonus_questions (id, label, subtitle, points, source_type, lock_scope, sort_order)
      VALUES (${q.id}, ${q.label}, ${q.subtitle}, ${q.points}, ${q.source_type}, ${q.lock_scope}, ${sortOrder})
      ON CONFLICT (id)
      DO UPDATE SET label = ${q.label}, subtitle = ${q.subtitle}, points = ${q.points},
                    source_type = ${q.source_type}, lock_scope = ${q.lock_scope}, updated_at = NOW()
    `;
    console.log(`  ✓ ${q.id}: "${q.label}" (+${q.points} pts)`);
  }

  console.log("\nDone! Both prode bonus questions seeded.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
