/**
 * Scrape FIFA World Cup 2026 squads from Wikipedia and seed the players table.
 *
 * Run with: npx ts-node --esm --skip-project scripts/seed-players.ts
 *
 * Requires DATABASE_URL in .env.local
 * Source: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads
 *
 * Re-run after June 2, 2026 when all 48 squads are confirmed.
 */

import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}

const WIKI_URL = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads";

const TEAM_NAME_TO_ID: Record<string, string> = {
  "Mexico": "MEX", "South Africa": "RSA", "Korea Republic": "KOR", "South Korea": "KOR",
  "Czechia": "CZE", "Czech Republic": "CZE", "Canada": "CAN",
  "Bosnia and Herzegovina": "BIH", "Bosnia-Herzegovina": "BIH",
  "Qatar": "QAT", "Switzerland": "SUI", "Brazil": "BRA", "Morocco": "MAR",
  "Haiti": "HAI", "Scotland": "SCO", "United States": "USA", "USA": "USA",
  "Paraguay": "PAR", "Australia": "AUS", "Turkey": "TUR", "Türkiye": "TUR",
  "Germany": "GER", "Curacao": "CUW", "Curaçao": "CUW",
  "Ivory Coast": "CIV", "Côte d'Ivoire": "CIV", "Cote d'Ivoire": "CIV",
  "Ecuador": "ECU", "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE",
  "Tunisia": "TUN", "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN",
  "New Zealand": "NZL", "Spain": "ESP", "Cape Verde": "CPV", "Cabo Verde": "CPV",
  "Saudi Arabia": "KSA", "Uruguay": "URU", "France": "FRA", "Senegal": "SEN",
  "Iraq": "IRQ", "Norway": "NOR", "Argentina": "ARG", "Algeria": "ALG",
  "Austria": "AUT", "Jordan": "JOR", "Portugal": "POR",
  "DR Congo": "COD", "Congo DR": "COD", "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
};

interface Player {
  teamId: string;
  name: string;
  position: string;
  number: number;
}

function parseSquadTable(html: string, teamName: string, teamId: string): Player[] {
  const players: Player[] = [];

  // Match table rows with player data
  // Wikipedia squad tables have rows like: <td>1</td><td>GK</td><td>...Player Name...</td>...
  const rowRegex = /<tr[^>]*>\s*<t[dh][^>]*>(\d+)<\/t[dh]>\s*<t[dh][^>]*>(\w+)<\/t[dh]>\s*<t[dh][^>]*>(.*?)<\/t[dh]>/gs;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const number = parseInt(match[1], 10);
    const position = match[2].trim();
    // Extract player name from potentially linked text
    const nameHtml = match[3];
    const nameMatch = nameHtml.match(/>([^<]+)<\/a>/) || nameHtml.match(/^([^<]+)$/);
    if (!nameMatch) continue;

    const name = nameMatch[1].trim().replace(/\s+/g, " ");
    if (!name || !["GK", "DF", "MF", "FW"].includes(position)) continue;

    players.push({ teamId, name, position, number });
  }

  return players;
}

async function main() {
  console.log("Fetching Wikipedia squads page...");
  const res = await fetch(WIKI_URL);
  if (!res.ok) {
    console.error(`Failed to fetch: ${res.status}`);
    process.exit(1);
  }

  const html = await res.text();

  // Find team sections — each team has an h3 with the team name followed by a squad table
  const sectionRegex = /<h3[^>]*>.*?<span[^>]*id="([^"]*)"[^>]*>([^<]*)<\/span>.*?<\/h3>([\s\S]*?)(?=<h[23]|$)/g;

  const allPlayers: Player[] = [];
  let sectionMatch;

  while ((sectionMatch = sectionRegex.exec(html)) !== null) {
    const teamName = sectionMatch[2].trim();
    const teamId = TEAM_NAME_TO_ID[teamName];
    if (!teamId) continue;

    const sectionHtml = sectionMatch[3];
    const players = parseSquadTable(sectionHtml, teamName, teamId);

    if (players.length > 0) {
      console.log(`  ${teamName} (${teamId}): ${players.length} players`);
      allPlayers.push(...players);
    }
  }

  if (allPlayers.length === 0) {
    console.log("\n⚠️  No players found. Wikipedia squads may not be published yet.");
    console.log("   Re-run after June 2, 2026 when FIFA confirms all 48 squads.");
    process.exit(0);
  }

  console.log(`\nFound ${allPlayers.length} players across ${new Set(allPlayers.map((p) => p.teamId)).size} teams`);

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Seeding database...");
  let inserted = 0;
  for (const p of allPlayers) {
    try {
      await sql`
        INSERT INTO players (team_id, name, position, number)
        VALUES (${p.teamId}, ${p.name}, ${p.position}, ${p.number})
        ON CONFLICT (team_id, name) DO UPDATE SET position = ${p.position}, number = ${p.number}
      `;
      inserted++;
    } catch (e) {
      console.error(`  ✗ Failed: ${p.name} (${p.teamId})`, e);
    }
  }

  console.log(`\n✅ Seeded ${inserted} players`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
