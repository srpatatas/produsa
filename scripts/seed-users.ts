/**
 * Seed invite codes for participants.
 *
 * Run with: npx ts-node --esm --skip-project scripts/seed-users.ts
 */

import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}

const participants = [
  { name: "Fede", code: "FEDE2026", avatar: "🧉", is_admin: true },
  { name: "Nico", code: "NICO2026", avatar: "🎸", is_admin: false },
  { name: "Juanchi", code: "JUANCHI2026", avatar: "🥁", is_admin: false },
  { name: "Mati", code: "MATI2026", avatar: "🏄", is_admin: false },
  { name: "Sofi", code: "SOFI2026", avatar: "🎨", is_admin: false },
  { name: "Caro", code: "CARO2026", avatar: "🌸", is_admin: false },
  { name: "Tincho", code: "TINCHO2026", avatar: "🧢", is_admin: false },
  { name: "Player 1", code: "PLAYER2026", avatar: "⚽", is_admin: false },
];

async function main() {
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Seeding invite codes...\n");

  for (const p of participants) {
    await sql`
      INSERT INTO users (name, invite_code, pin, avatar, is_admin)
      VALUES (${p.name}, ${p.code}, 'PENDING', ${p.avatar}, ${p.is_admin})
      ON CONFLICT (invite_code) DO NOTHING
    `;
    console.log(`  ✓ ${p.code} (${p.name}) ${p.is_admin ? "[ADMIN]" : ""}`);
  }

  console.log("\n✅ Done! Share the codes with your friends.");
  console.log("   They'll set their own PIN on first login.\n");
  console.log("   Codes:");
  for (const p of participants) {
    console.log(`   ${p.name}: ${p.code}`);
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
