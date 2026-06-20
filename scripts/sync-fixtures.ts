/**
 * Sync FIFA World Cup 2026 fixture IDs from API-Football.
 *
 * Run with: npx ts-node --esm scripts/sync-fixtures.ts
 *
 * Fetches all World Cup 2026 fixtures from the API and maps them
 * to our match IDs (A-1, A-2, etc.) by matching team names.
 * Outputs the mapping to src/data/fixtureMap.ts
 */

const API_BASE = "https://v3.football.api-sports.io";
const API_KEY = process.env.API_FOOTBALL_KEY;
const WORLD_CUP_LEAGUE_ID = 1;
const SEASON = 2026;

// Map API-Football team names to our team IDs
const TEAM_NAME_TO_ID: Record<string, string> = {
  "Mexico": "MEX",
  "South Africa": "RSA",
  "South Korea": "KOR",
  "Korea Republic": "KOR",
  "Czech Republic": "CZE",
  "Czechia": "CZE",
  "Canada": "CAN",
  "Bosnia": "BIH",
  "Bosnia and Herzegovina": "BIH",
  "Bosnia And Herzegovina": "BIH",
  "Bosnia & Herzegovina": "BIH",
  "Qatar": "QAT",
  "Switzerland": "SUI",
  "Brazil": "BRA",
  "Morocco": "MAR",
  "Haiti": "HAI",
  "Scotland": "SCO",
  "USA": "USA",
  "United States": "USA",
  "Paraguay": "PAR",
  "Australia": "AUS",
  "Turkey": "TUR",
  "Türkiye": "TUR",
  "Germany": "GER",
  "Curacao": "CUW",
  "Curaçao": "CUW",
  "Ivory Coast": "CIV",
  "Cote D'Ivoire": "CIV",
  "Ecuador": "ECU",
  "Netherlands": "NED",
  "Japan": "JPN",
  "Sweden": "SWE",
  "Tunisia": "TUN",
  "Belgium": "BEL",
  "Egypt": "EGY",
  "Iran": "IRN",
  "New Zealand": "NZL",
  "Spain": "ESP",
  "Cape Verde": "CPV",
  "Cabo Verde": "CPV",
  "Cape Verde Islands": "CPV",
  "Saudi Arabia": "KSA",
  "Uruguay": "URU",
  "France": "FRA",
  "Senegal": "SEN",
  "Iraq": "IRQ",
  "Norway": "NOR",
  "Argentina": "ARG",
  "Algeria": "ALG",
  "Austria": "AUT",
  "Jordan": "JOR",
  "Portugal": "POR",
  "DR Congo": "COD",
  "Congo DR": "COD",
  "Uzbekistan": "UZB",
  "Colombia": "COL",
  "England": "ENG",
  "Croatia": "CRO",
  "Ghana": "GHA",
  "Panama": "PAN",
};

// Build team pair → match ID map from actual matches.ts definitions
import * as fs_sync from "fs";
const matchesSrc = fs_sync.readFileSync("src/data/matches.ts", "utf8");
const matchByTeamPair = new Map<string, string>();
const matchRe = /\{\s*id:\s*"([^"]+)".*?homeTeamId:\s*"([^"]+)".*?awayTeamId:\s*"([^"]+)"/g;
let matchEntry;
while ((matchEntry = matchRe.exec(matchesSrc)) !== null) {
  const [, id, home, away] = matchEntry;
  matchByTeamPair.set(`${home}-${away}`, id);
}

interface ApiFixture {
  fixture: { id: number; date: string };
  teams: {
    home: { name: string };
    away: { name: string };
  };
}

async function main() {
  if (!API_KEY) {
    console.error("Missing API_FOOTBALL_KEY env variable");
    process.exit(1);
  }

  console.log("Fetching World Cup 2026 fixtures from API-Football...\n");

  const res = await fetch(
    `${API_BASE}/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${SEASON}`,
    { headers: { "x-apisports-key": API_KEY } },
  );

  const data = await res.json();
  const fixtures: ApiFixture[] = data.response;

  if (fixtures.length === 0) {
    console.log("No fixtures found yet. The API probably hasn't populated 2026 data.");
    console.log("Try again closer to the tournament (May/June 2026).\n");
    process.exit(0);
  }

  console.log(`Found ${fixtures.length} fixtures.\n`);

  const mapping: Record<number, string> = {};
  const unmatched: string[] = [];

  for (const f of fixtures) {
    const homeName = f.teams.home.name;
    const awayName = f.teams.away.name;
    const homeId = TEAM_NAME_TO_ID[homeName];
    const awayId = TEAM_NAME_TO_ID[awayName];

    if (!homeId) {
      unmatched.push(`Unknown home team: "${homeName}" (fixture ${f.fixture.id})`);
      continue;
    }
    if (!awayId) {
      unmatched.push(`Unknown away team: "${awayName}" (fixture ${f.fixture.id})`);
      continue;
    }

    const key = `${homeId}-${awayId}`;
    const matchId = matchByTeamPair.get(key);

    if (!matchId) {
      // Try reverse (API might swap home/away)
      const reverseKey = `${awayId}-${homeId}`;
      const reverseMatchId = matchByTeamPair.get(reverseKey);
      if (reverseMatchId) {
        mapping[f.fixture.id] = reverseMatchId;
        console.log(`  ✓ ${f.fixture.id} → ${reverseMatchId} (${homeName} vs ${awayName}) [reversed]`);
      } else {
        unmatched.push(`No match found for: ${homeName} (${homeId}) vs ${awayName} (${awayId})`);
      }
      continue;
    }

    mapping[f.fixture.id] = matchId;
    console.log(`  ✓ ${f.fixture.id} → ${matchId} (${homeName} vs ${awayName})`);
  }

  if (unmatched.length > 0) {
    console.log(`\n⚠ ${unmatched.length} unmatched fixtures:`);
    for (const msg of unmatched) {
      console.log(`  - ${msg}`);
    }
  }

  // Write the mapping file (preserve API_TEAM_NAME_TO_ID from current file)
  const currentMap = fs_sync.readFileSync("src/data/fixtureMap.ts", "utf8");
  const teamNameSection = currentMap.substring(0, currentMap.indexOf("export const fixtureToMatch"));

  const sorted = Object.entries(mapping).sort((a, b) => Number(a[0]) - Number(b[0]));
  const entries = sorted.map(([k, v]) => `  "${k}": "${v}"`).join(",\n");

  const output = `${teamNameSection}export const fixtureToMatch: Record<number, string> = {
${entries}
};

export const matchToFixture: Record<string, number> = Object.fromEntries(
  Object.entries(fixtureToMatch).map(([k, v]) => [v, Number(k)]),
);
`;

  const fs = await import("fs");
  fs.writeFileSync("src/data/fixtureMap.ts", output);

  const matched = Object.keys(mapping).length;
  console.log(`\n✅ Mapped ${matched}/${fixtures.length} fixtures → src/data/fixtureMap.ts`);
}

main().catch(console.error);
