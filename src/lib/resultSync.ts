import { getDb } from "./db";
import { invalidateResultsCache } from "./resultsService";
import { getAllUnifiedMatches } from "./unifiedMatches";
import { fixtureToMatch, matchToFixture, API_TEAM_NAME_TO_ID } from "@/data/fixtureMap";
import { matches } from "@/data/matches";

const API_BASE = "https://v3.football.api-sports.io";
const CHECK_START_MS = 105 * 60 * 1000;
const CHECK_END_MS = 6 * 60 * 60 * 1000;
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

interface ApiScore {
  home: number | null;
  away: number | null;
}

interface ApiFixtureDetail {
  fixture: {
    id: number;
    status: { short: string; elapsed: number | null };
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  goals: ApiScore;
  score: {
    fulltime: ApiScore;
    extratime: ApiScore;
    penalty: ApiScore;
  };
}

const matchById = new Map(matches.map((m) => [m.id, m]));

let lastSyncMs = 0;
const SYNC_COOLDOWN_MS = 4 * 60 * 1000; // Don't sync more than once per 4 min

export async function syncFinishedResults(): Promise<string[]> {
  const now = Date.now();
  if (now - lastSyncMs < SYNC_COOLDOWN_MS) return [];

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return [];

  const pending = getPendingMatches(now);
  if (pending.length === 0) return [];

  lastSyncMs = now;

  const fixtureIds = pending
    .map((id) => matchToFixture[id])
    .filter(Boolean);
  if (fixtureIds.length === 0) return [];

  const sql = getDb();

  try {
    const res = await fetch(
      `${API_BASE}/fixtures?ids=${fixtureIds.join("-")}`,
      { headers: { "x-apisports-key": apiKey } },
    );
    if (!res.ok) return [];

    const data = await res.json();
    const fixtures: ApiFixtureDetail[] = data.response ?? [];
    const saved: string[] = [];

    for (const f of fixtures) {
      const status = f.fixture.status.short;
      if (!FINISHED_STATUSES.has(status)) continue;

      const matchId = fixtureToMatch[f.fixture.id];
      if (!matchId) continue;

      const match = matchById.get(matchId);
      const apiHomeId = API_TEAM_NAME_TO_ID[f.teams.home.name];
      const reversed = !!(match && apiHomeId && apiHomeId !== match.homeTeamId);

      const homeScore = reversed ? (f.goals.away ?? 0) : (f.goals.home ?? 0);
      const awayScore = reversed ? (f.goals.home ?? 0) : (f.goals.away ?? 0);
      const homePenalty =
        status === "PEN" ? (reversed ? (f.score.penalty.away ?? null) : (f.score.penalty.home ?? null)) : null;
      const awayPenalty =
        status === "PEN" ? (reversed ? (f.score.penalty.home ?? null) : (f.score.penalty.away ?? null)) : null;

      await sql`
        INSERT INTO match_results (match_id, home_score, away_score, home_penalty, away_penalty)
        VALUES (${matchId}, ${homeScore}, ${awayScore}, ${homePenalty}, ${awayPenalty})
        ON CONFLICT (match_id)
        DO UPDATE SET home_score = ${homeScore}, away_score = ${awayScore},
          home_penalty = ${homePenalty}, away_penalty = ${awayPenalty}, updated_at = NOW()
      `;
      saved.push(matchId);
    }

    if (saved.length > 0) {
      invalidateResultsCache();
    }
    return saved;
  } catch (err) {
    console.error("[resultSync] Failed:", err);
    return [];
  }
}

function getPendingMatches(now: number): string[] {
  return getAllUnifiedMatches()
    .filter((m) => {
      const kickoff = new Date(m.kickoff).getTime();
      const elapsed = now - kickoff;
      return elapsed >= CHECK_START_MS && elapsed <= CHECK_END_MS;
    })
    .map((m) => m.id);
}
