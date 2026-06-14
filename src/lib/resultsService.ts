import { MatchResult } from "@/data/results";
import { getDb } from "./db";
import { matches } from "@/data/matches";
import { isAnyMatchInLiveWindow } from "./unifiedMatches";
import { API_TEAM_NAME_TO_ID } from "@/data/fixtureMap";

const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const SYNC_INTERVAL_DEFAULT = 30 * 60 * 1000; // 30 minutes
const SYNC_INTERVAL_LIVE = 5 * 60 * 1000; // 5 minutes during matches

const TEAM_NAME_TO_ID = API_TEAM_NAME_TO_ID;

const matchByTeamPair = new Map<string, string>();
for (const m of matches) {
  matchByTeamPair.set(`${m.homeTeamId}-${m.awayTeamId}`, m.id);
}

interface OpenFootballMatch {
  team1: string;
  team2: string;
  score?: { ft?: [number, number] };
}

let lastSyncTimestamp = 0;
let cachedResults: Record<string, MatchResult> | null = null;
let cacheTimestamp = 0;
const RESULTS_CACHE_TTL = 60 * 1000; // 1 minute in-memory cache for DB reads

async function syncFromOpenFootball(): Promise<void> {
  try {
    const res = await fetch(OPENFOOTBALL_URL);
    if (!res.ok) return;

    const data = await res.json();
    const apiMatches: OpenFootballMatch[] = data.matches ?? [];
    const sql = getDb();

    for (const m of apiMatches) {
      if (!m.score?.ft) continue;

      const homeId = TEAM_NAME_TO_ID[m.team1];
      const awayId = TEAM_NAME_TO_ID[m.team2];
      if (!homeId || !awayId) continue;

      let matchId = matchByTeamPair.get(`${homeId}-${awayId}`);
      let homeScore = m.score.ft[0];
      let awayScore = m.score.ft[1];

      if (!matchId) {
        matchId = matchByTeamPair.get(`${awayId}-${homeId}`);
        if (matchId) {
          homeScore = m.score.ft[1];
          awayScore = m.score.ft[0];
        } else {
          continue;
        }
      }

      await sql`
        INSERT INTO match_results (match_id, home_score, away_score)
        VALUES (${matchId}, ${homeScore}, ${awayScore})
        ON CONFLICT (match_id)
        DO UPDATE SET home_score = ${homeScore}, away_score = ${awayScore}, updated_at = NOW()
      `;
    }
  } catch (err) {
    console.error("[resultsService] OpenFootball sync failed:", err);
  }
}

async function maybeSyncFromOpenFootball(): Promise<void> {
  const now = Date.now();
  const interval = isAnyMatchInLiveWindow() ? SYNC_INTERVAL_LIVE : SYNC_INTERVAL_DEFAULT;
  if (now - lastSyncTimestamp < interval) return;
  lastSyncTimestamp = now;
  await syncFromOpenFootball();
}

export async function getResults(): Promise<Record<string, MatchResult>> {
  await maybeSyncFromOpenFootball();

  const now = Date.now();
  if (cachedResults && now - cacheTimestamp < RESULTS_CACHE_TTL) {
    return cachedResults;
  }

  const sql = getDb();
  const rows = await sql`SELECT match_id, home_score, away_score, home_penalty, away_penalty FROM match_results`;

  const results: Record<string, MatchResult> = {};
  for (const row of rows) {
    const r: MatchResult = {
      matchId: row.match_id as string,
      homeScore: row.home_score as number,
      awayScore: row.away_score as number,
    };
    if (row.home_penalty != null) r.homePenalty = row.home_penalty as number;
    if (row.away_penalty != null) r.awayPenalty = row.away_penalty as number;
    results[row.match_id as string] = r;
  }

  cachedResults = results;
  cacheTimestamp = now;
  return results;
}

export function invalidateResultsCache(): void {
  cachedResults = null;
  cacheTimestamp = 0;
}

export async function getResult(matchId: string): Promise<MatchResult | undefined> {
  const results = await getResults();
  return results[matchId];
}
