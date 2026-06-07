import { getDb } from "./db";
import { invalidateResultsCache } from "./resultsService";
import { getAllUnifiedMatches } from "./unifiedMatches";
import { fixtureToMatch, matchToFixture } from "@/data/fixtureMap";

const API_BASE = "https://v3.football.api-sports.io";
const CHECK_START_MS = 105 * 60 * 1000;
const CHECK_END_MS = 180 * 60 * 1000;
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
  goals: ApiScore;
  score: {
    fulltime: ApiScore;
    extratime: ApiScore;
    penalty: ApiScore;
  };
}

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

  const sql = getDb();
  const existingRows = await sql`SELECT match_id FROM match_results`;
  const existingIds = new Set(existingRows.map((r) => r.match_id as string));

  const unsaved = pending.filter((id) => !existingIds.has(id));
  if (unsaved.length === 0) return [];

  const fixtureIds = unsaved
    .map((id) => matchToFixture[id])
    .filter(Boolean);
  if (fixtureIds.length === 0) return [];

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

      const homeScore = f.goals.home ?? 0;
      const awayScore = f.goals.away ?? 0;
      const homePenalty =
        status === "PEN" ? (f.score.penalty.home ?? null) : null;
      const awayPenalty =
        status === "PEN" ? (f.score.penalty.away ?? null) : null;

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
