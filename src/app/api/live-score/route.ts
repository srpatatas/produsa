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

export async function GET() {
  if (!isAnyMatchInLiveWindow()) {
    return NextResponse.json({ scores: {}, finished: [] });
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

  return NextResponse.json({ scores, finished });
}
