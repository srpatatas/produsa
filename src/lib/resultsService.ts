import { MatchResult } from "@/data/results";

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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

import { matches } from "@/data/matches";

const matchByTeamPair = new Map<string, string>();
for (const m of matches) {
  matchByTeamPair.set(`${m.homeTeamId}-${m.awayTeamId}`, m.id);
}

interface OpenFootballMatch {
  team1: string;
  team2: string;
  score?: { ft?: [number, number] };
}

let cachedResults: Record<string, MatchResult> | null = null;
let cacheTimestamp = 0;

async function fetchFromOpenFootball(): Promise<Record<string, MatchResult>> {
  try {
    const res = await fetch(OPENFOOTBALL_URL, { next: { revalidate: 1800 } });
    if (!res.ok) return {};

    const data = await res.json();
    const apiMatches: OpenFootballMatch[] = data.matches ?? [];
    const results: Record<string, MatchResult> = {};

    for (const m of apiMatches) {
      if (!m.score?.ft) continue;

      const homeId = TEAM_NAME_TO_ID[m.team1];
      const awayId = TEAM_NAME_TO_ID[m.team2];
      if (!homeId || !awayId) continue;

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
          continue;
        }
        continue;
      }

      results[matchId] = {
        matchId,
        homeScore: m.score.ft[0],
        awayScore: m.score.ft[1],
      };
    }

    return results;
  } catch {
    return {};
  }
}

export async function getResults(): Promise<Record<string, MatchResult>> {
  const now = Date.now();
  if (cachedResults && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedResults;
  }

  const fresh = await fetchFromOpenFootball();

  // Only update cache if we got results, otherwise keep stale cache
  if (Object.keys(fresh).length > 0 || !cachedResults) {
    cachedResults = fresh;
    cacheTimestamp = now;
  }

  return cachedResults;
}

export async function getResult(matchId: string): Promise<MatchResult | undefined> {
  const results = await getResults();
  return results[matchId];
}
