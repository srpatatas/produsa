import { NextResponse } from "next/server";
import { fetchLiveScores, LiveScoreResult } from "@/lib/liveScoreApi";
import { isAnyMatchInLiveWindow, getLiveUnifiedMatches } from "@/lib/unifiedMatches";
import { getDb } from "@/lib/db";
import { invalidateResultsCache } from "@/lib/resultsService";
import { syncFinishedResults } from "@/lib/resultSync";

export const dynamic = "force-dynamic";

const trackedLive = new Map<string, LiveScoreResult>();

async function saveFinishedMatch(matchId: string, score: LiveScoreResult): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO match_results (match_id, home_score, away_score)
    VALUES (${matchId}, ${score.homeScore}, ${score.awayScore})
    ON CONFLICT (match_id)
    DO UPDATE SET home_score = ${score.homeScore}, away_score = ${score.awayScore}, updated_at = NOW()
  `;
  invalidateResultsCache();
}

async function getFinishedMatchIds(): Promise<Set<string>> {
  const liveMatches = getLiveUnifiedMatches();
  if (liveMatches.length === 0) return new Set();
  const ids = liveMatches.map((m) => m.id);
  const sql = getDb();
  const rows = await sql`SELECT match_id FROM match_results WHERE match_id = ANY(${ids})`;
  return new Set(rows.map((r) => r.match_id as string));
}

let responseCache: { data: unknown; time: number } | null = null;
const RESPONSE_CACHE_TTL = 12_000;

export async function GET() {
  const cdnHeaders = { "Cache-Control": "public, s-maxage=12, stale-while-revalidate=30" };

  if (!isAnyMatchInLiveWindow()) {
    return NextResponse.json({ scores: {}, finished: [] }, { headers: cdnHeaders });
  }

  if (responseCache && Date.now() - responseCache.time < RESPONSE_CACHE_TTL) {
    return NextResponse.json(responseCache.data, { headers: cdnHeaders });
  }

  // DEV HACK: simulate a live game for A-6
  if (process.env.NODE_ENV === "development") {
    const kickoff = new Date("2026-06-24T04:29:00Z").getTime();
    const elapsed = Math.floor((Date.now() - kickoff) / 1000);
    if (elapsed < 0) return NextResponse.json({ scores: {}, finished: [] }, { headers: cdnHeaders });
    const min = Math.min(90, Math.floor(elapsed / 1)); // 1s real = 1 game min (DEV SPEED)
    let homeScore = 0;
    let awayScore = 0;
    const events: { minute: number; extra: null; type: string; side: string; player: string; detail?: string }[] = [];
    if (min >= 12) { homeScore = 1; events.push({ minute: 12, extra: null, type: "goal", side: "home", player: "Tau" }); }
    if (min >= 23) { events.push({ minute: 23, extra: null, type: "yellow", side: "away", player: "Son" }); }
    if (min >= 38) { awayScore = 1; events.push({ minute: 38, extra: null, type: "goal", side: "away", player: "Son" }); }
    if (min >= 55) { homeScore = 2; events.push({ minute: 55, extra: null, type: "goal", side: "home", player: "Zwane" }); }
    if (min >= 67) { events.push({ minute: 67, extra: null, type: "yellow", side: "home", player: "Mokwana" }); }
    if (min >= 72) { events.push({ minute: 72, extra: null, type: "red", side: "away", player: "Kim" }); }
    if (min >= 81) { awayScore = 2; events.push({ minute: 81, extra: null, type: "goal", side: "away", player: "Hwang" }); }
    if (min >= 88) { homeScore = 3; events.push({ minute: 88, extra: null, type: "goal", side: "home", player: "Tau" }); }
    const mockScores = {
      "A-6": { homeScore, awayScore, minute: min, extra: null, status: min < 45 ? "1H" : min === 45 ? "HT" : "2H", events },
    };
    return NextResponse.json({ scores: mockScores, finished: [] }, { headers: cdnHeaders });
  }

  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return NextResponse.json({ scores: {}, finished: [] });
  }

  let scores: Record<string, LiveScoreResult>;
  try {
    scores = await fetchLiveScores(key);
  } catch (err) {
    console.error("[live-score] Failed to fetch live scores:", err);
    return NextResponse.json({ scores: {}, finished: [] });
  }

  const finished: string[] = [];

  for (const [matchId, lastScore] of trackedLive) {
    if (!scores[matchId]) {
      finished.push(matchId);
      try {
        await saveFinishedMatch(matchId, lastScore);
      } catch (err) {
        console.error(`[live-score] Failed to save finished match ${matchId}:`, err);
      }
      trackedLive.delete(matchId);
    }
  }

  const dbFinished = await getFinishedMatchIds();
  for (const id of dbFinished) {
    if (!scores[id] && !finished.includes(id)) {
      finished.push(id);
    }
  }

  for (const [matchId, score] of Object.entries(scores)) {
    trackedLive.set(matchId, score);
  }

  const synced = await syncFinishedResults();
  if (synced.length > 0) {
    for (const id of synced) {
      if (!finished.includes(id)) finished.push(id);
    }
  }

  const response = { scores, finished };
  responseCache = { data: response, time: Date.now() };
  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=12, stale-while-revalidate=30",
    },
  });
}
