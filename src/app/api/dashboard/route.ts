import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getResults } from "@/lib/resultsService";
import { syncFinishedResults } from "@/lib/resultSync";
import {
  getTodayUnifiedMatches,
  getAllUnifiedMatches,
} from "@/lib/unifiedMatches";
import { setLiveResults, isKnockoutMatchPredictable } from "@/lib/knockoutResolver";
import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { KnockoutRound } from "@/types";

export async function GET() {
  const sql = getDb();

  await syncFinishedResults();

  const [lockRows, resultsMap, matchSettingsRows] = await Promise.all([
    sql`SELECT scope, locks_at FROM lock_deadlines`,
    getResults(),
    sql`SELECT match_id, exact_score FROM match_settings WHERE exact_score = true`,
  ]);

  setLiveResults(resultsMap);

  const now = Date.now();
  const locks: Record<string, { locksAt: string; isLocked: boolean }> = {};
  for (const row of lockRows) {
    const locksAt = row.locks_at as string;
    locks[row.scope as string] = {
      locksAt,
      isLocked: new Date(locksAt).getTime() <= now,
    };
  }

  const allMatches = getAllUnifiedMatches();

  const todayMatches = getTodayUnifiedMatches().filter((m) => !resultsMap[m.id]);

  const recentResults = allMatches
    .filter((m) => resultsMap[m.id])
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
    .slice(0, 3)
    .map((m) => ({
      ...m,
      homeScore: resultsMap[m.id].homeScore,
      awayScore: resultsMap[m.id].awayScore,
      homePenalty: resultsMap[m.id].homePenalty ?? null,
      awayPenalty: resultsMap[m.id].awayPenalty ?? null,
    }));

  const nextMatch = allMatches
    .filter((m) => new Date(m.kickoff).getTime() > now)
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0] ?? null;

  const knockoutScopes: Record<string, string[]> = {
    R32: ["R32"], R16: ["R16"], QF: ["QF"], SF: ["SF"], FINAL: ["3P", "F"],
  };
  const knockoutPredictable: Record<string, boolean> = {};
  for (const [scope, rounds] of Object.entries(knockoutScopes)) {
    const matches = rounds.flatMap((r) => getKnockoutMatchesByRound(r as KnockoutRound));
    knockoutPredictable[scope] = matches.length > 0 && matches.every((m) => isKnockoutMatchPredictable(m));
  }

  return NextResponse.json({
    todayMatches,
    recentResults,
    nextMatch,
    locks,
    knockoutPredictable,
  }, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600" },
  });
}
