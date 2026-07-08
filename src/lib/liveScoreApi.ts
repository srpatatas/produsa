import { fixtureToMatch, matchToFixture, API_TEAM_NAME_TO_ID } from "@/data/fixtureMap";
import { matches } from "@/data/matches";
import { getLiveUnifiedMatches } from "@/lib/unifiedMatches";
import type { LiveEvent } from "@/types";

const matchById = new Map(matches.map((m) => [m.id, m]));

const API_BASE = "https://v3.football.api-sports.io";
const CACHE_TTL_MS = 15_000;
const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "P", "BT", "LIVE"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

const FIXTURE_IDS = new Set(Object.keys(fixtureToMatch).map(Number));

export interface LiveScoreResult {
  homeScore: number;
  awayScore: number;
  homePenalty: number | null;
  awayPenalty: number | null;
  minute: number;
  extra: number | null;
  status: string;
  events: LiveEvent[];
}

let cachedScores: Record<string, LiveScoreResult> = {};
let cacheTimestamp = 0;

function parseEvents(
  rawEvents: Array<Record<string, unknown>>,
  homeTeamId: number,
  reversed = false,
): LiveEvent[] {
  const events: LiveEvent[] = [];

  for (const e of rawEvents) {
    const type = e.type as string;
    const detail = (e.detail as string) ?? "";
    const time = e.time as { elapsed: number; extra: number | null };
    const team = e.team as { id: number };
    const player = e.player as { name: string } | null;
    const apiSide = team.id === homeTeamId ? "home" : "away";
    const side = reversed ? (apiSide === "home" ? "away" : "home") : apiSide;

    if (type === "Goal") {
      events.push({
        minute: time.elapsed,
        extra: time.extra,
        type: "goal",
        side,
        player: player?.name ?? "",
        detail: detail !== "Normal Goal" ? detail : undefined,
      });
    } else if (type === "Card") {
      const isRed = detail === "Red Card" || detail === "Second Yellow card";
      events.push({
        minute: time.elapsed,
        extra: time.extra,
        type: isRed ? "red" : "yellow",
        side,
        player: player?.name ?? "",
      });
    }
  }

  return events;
}

export async function fetchLiveScores(
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<Record<string, LiveScoreResult>> {
  const now = Date.now();
  if (now - cacheTimestamp < CACHE_TTL_MS) return cachedScores;

  const liveMatches = getLiveUnifiedMatches();
  const liveFixtureIds = liveMatches
    .map((m) => matchToFixture[m.id])
    .filter(Boolean);

  if (liveFixtureIds.length === 0) {
    cachedScores = {};
    cacheTimestamp = now;
    return cachedScores;
  }

  const res = await fetchFn(
    `${API_BASE}/fixtures?ids=${liveFixtureIds.join("-")}`,
    { headers: { "x-apisports-key": apiKey } },
  );

  if (!res.ok) return cachedScores;

  const data = await res.json();
  const scores: Record<string, LiveScoreResult> = {};

  for (const f of data.response) {
    const fixtureId = f.fixture.id as number;
    if (!FIXTURE_IDS.has(fixtureId)) continue;
    const status = f.fixture.status.short as string;
    if (!LIVE_STATUSES.has(status) && !FINISHED_STATUSES.has(status)) continue;

    const matchId = fixtureToMatch[fixtureId];
    const match = matchById.get(matchId);
    const homeTeamId = (f.teams?.home?.id as number) ?? 0;
    const rawEvents = (f.events as Array<Record<string, unknown>>) ?? [];

    const apiHomeName = f.teams?.home?.name as string | undefined;
    const apiHomeId = apiHomeName ? API_TEAM_NAME_TO_ID[apiHomeName] : undefined;
    const reversed = !!(match && apiHomeId && apiHomeId !== match.homeTeamId);

    const penHome = f.score?.penalty?.home ?? null;
    const penAway = f.score?.penalty?.away ?? null;

    scores[matchId] = {
      homeScore: reversed ? (f.goals.away ?? 0) : (f.goals.home ?? 0),
      awayScore: reversed ? (f.goals.home ?? 0) : (f.goals.away ?? 0),
      homePenalty: reversed ? penAway : penHome,
      awayPenalty: reversed ? penHome : penAway,
      minute: f.fixture.status.elapsed ?? 0,
      extra: f.fixture.status.extra ?? null,
      status: f.fixture.status.short,
      events: parseEvents(rawEvents, homeTeamId, reversed),
    };
  }

  cachedScores = scores;
  cacheTimestamp = now;
  return scores;
}
