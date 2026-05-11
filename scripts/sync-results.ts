/**
 * Sync match results from OpenFootball (free, no API key, no rate limits).
 *
 * Run with: npx ts-node --esm --skip-project scripts/sync-results.ts
 *
 * Fetches completed World Cup 2026 match results and updates
 * src/data/results.ts automatically.
 */

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

// Map OpenFootball team names to our team IDs
const TEAM_NAME_TO_ID: Record<string, string> = {
  "Mexico": "MEX",
  "South Africa": "RSA",
  "Korea Republic": "KOR",
  "South Korea": "KOR",
  "Czechia": "CZE",
  "Czech Republic": "CZE",
  "Canada": "CAN",
  "Bosnia and Herzegovina": "BIH",
  "Bosnia-Herzegovina": "BIH",
  "Qatar": "QAT",
  "Switzerland": "SUI",
  "Brazil": "BRA",
  "Morocco": "MAR",
  "Haiti": "HAI",
  "Scotland": "SCO",
  "United States": "USA",
  "USA": "USA",
  "Paraguay": "PAR",
  "Australia": "AUS",
  "Turkey": "TUR",
  "Türkiye": "TUR",
  "Germany": "GER",
  "Curacao": "CUW",
  "Curaçao": "CUW",
  "Ivory Coast": "CIV",
  "Côte d'Ivoire": "CIV",
  "Cote d'Ivoire": "CIV",
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

// Build match lookup from our groups
const groups = [
  { id: "A", teams: ["MEX", "RSA", "KOR", "CZE"] },
  { id: "B", teams: ["CAN", "BIH", "QAT", "SUI"] },
  { id: "C", teams: ["BRA", "MAR", "HAI", "SCO"] },
  { id: "D", teams: ["USA", "PAR", "AUS", "TUR"] },
  { id: "E", teams: ["GER", "CUW", "CIV", "ECU"] },
  { id: "F", teams: ["NED", "JPN", "SWE", "TUN"] },
  { id: "G", teams: ["BEL", "EGY", "IRN", "NZL"] },
  { id: "H", teams: ["ESP", "CPV", "KSA", "URU"] },
  { id: "I", teams: ["FRA", "SEN", "IRQ", "NOR"] },
  { id: "J", teams: ["ARG", "ALG", "AUT", "JOR"] },
  { id: "K", teams: ["POR", "COD", "UZB", "COL"] },
  { id: "L", teams: ["ENG", "CRO", "GHA", "PAN"] },
];

const matchByTeamPair = new Map<string, string>();
for (const g of groups) {
  const [a, b, c, d] = g.teams;
  const pairings = [[a, b], [c, d], [a, c], [b, d], [a, d], [b, c]];
  pairings.forEach((p, i) => {
    const matchId = `${g.id}-${i + 1}`;
    matchByTeamPair.set(`${p[0]}-${p[1]}`, matchId);
  });
}

interface OpenFootballMatch {
  team1: string;
  team2: string;
  score?: {
    ft?: [number, number];
  };
  group?: string;
}

async function main() {
  console.log("Fetching World Cup 2026 results from OpenFootball...\n");

  const res = await fetch(OPENFOOTBALL_URL);
  if (!res.ok) {
    console.error(`Failed to fetch: ${res.status}`);
    process.exit(1);
  }

  const data = await res.json();
  const apiMatches: OpenFootballMatch[] = data.matches ?? [];

  if (apiMatches.length === 0) {
    console.log("No matches found yet. Data will be available once the tournament starts.");
    process.exit(0);
  }

  const results: Record<string, { matchId: string; homeScore: number; awayScore: number }> = {};
  const unmatched: string[] = [];

  for (const m of apiMatches) {
    if (!m.score?.ft) continue;

    const homeId = TEAM_NAME_TO_ID[m.team1];
    const awayId = TEAM_NAME_TO_ID[m.team2];

    if (!homeId) {
      unmatched.push(`Unknown team: "${m.team1}"`);
      continue;
    }
    if (!awayId) {
      unmatched.push(`Unknown team: "${m.team2}"`);
      continue;
    }

    const key = `${homeId}-${awayId}`;
    let matchId = matchByTeamPair.get(key);

    if (!matchId) {
      const reverseKey = `${awayId}-${homeId}`;
      matchId = matchByTeamPair.get(reverseKey);
      if (matchId) {
        results[matchId] = {
          matchId,
          homeScore: m.score.ft[1],
          awayScore: m.score.ft[0],
        };
        console.log(`  ✓ ${matchId}: ${homeId} ${m.score.ft[0]}-${m.score.ft[1]} ${awayId} [reversed]`);
        continue;
      }
      unmatched.push(`No match found for: ${m.team1} (${homeId}) vs ${m.team2} (${awayId})`);
      continue;
    }

    results[matchId] = {
      matchId,
      homeScore: m.score.ft[0],
      awayScore: m.score.ft[1],
    };
    console.log(`  ✓ ${matchId}: ${homeId} ${m.score.ft[0]}-${m.score.ft[1]} ${awayId}`);
  }

  if (unmatched.length > 0) {
    console.log(`\n⚠ ${unmatched.length} unmatched:`);
    for (const msg of unmatched) {
      console.log(`  - ${msg}`);
    }
  }

  // Generate results.ts
  const entries = Object.values(results)
    .sort((a, b) => a.matchId.localeCompare(b.matchId))
    .map(
      (r) =>
        `  "${r.matchId}": { matchId: "${r.matchId}", homeScore: ${r.homeScore}, awayScore: ${r.awayScore} },`,
    )
    .join("\n");

  const output = `// Auto-generated by scripts/sync-results.ts
// Last synced: ${new Date().toISOString()}
// Source: OpenFootball (https://github.com/openfootball/worldcup.json)

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export const matchResults: Record<string, MatchResult> = {
${entries}
};

export function getMatchResult(matchId: string): MatchResult | undefined {
  return matchResults[matchId];
}
`;

  const fs = await import("fs");
  fs.writeFileSync("src/data/results.ts", output);

  const count = Object.keys(results).length;
  console.log(`\n✅ Synced ${count} results → src/data/results.ts`);
}

main().catch(console.error);
