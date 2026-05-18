import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getResults } from "@/lib/resultsService";
import {
  getTodayUnifiedMatches,
  getAllUnifiedMatches,
} from "@/lib/unifiedMatches";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sql = getDb();

  const [lockRows, predictionRows, resultsMap] = await Promise.all([
    sql`SELECT scope, locks_at FROM lock_deadlines`,
    sql`SELECT match_id, outcome FROM planilla_predictions WHERE user_id = ${session.id}`,
    getResults(),
  ]);

  // Locks
  const now = Date.now();
  const locks: Record<string, { locksAt: string; isLocked: boolean }> = {};
  for (const row of lockRows) {
    const locksAt = row.locks_at as string;
    locks[row.scope as string] = {
      locksAt,
      isLocked: new Date(locksAt).getTime() <= now,
    };
  }

  // User predictions set
  const userPredictions = new Set<string>();
  for (const row of predictionRows) {
    userPredictions.add(row.match_id as string);
  }

  // Prediction completion per scope
  const allMatches = getAllUnifiedMatches();
  const matchesByScope: Record<string, string[]> = {};
  for (const m of allMatches) {
    if (!matchesByScope[m.scope]) matchesByScope[m.scope] = [];
    matchesByScope[m.scope].push(m.id);
  }

  const predictionStatus: Record<string, { total: number; completed: number }> = {};
  for (const [scope, matchIds] of Object.entries(matchesByScope)) {
    const completed = matchIds.filter((id) => userPredictions.has(id)).length;
    predictionStatus[scope] = { total: matchIds.length, completed };
  }

  // Today's matches — exclude finished (have a DB result)
  const todayMatches = getTodayUnifiedMatches().filter((m) => !resultsMap[m.id]);

  // Recent results — last 3 matches with DB results, sorted by kickoff descending
  const recentResults = allMatches
    .filter((m) => resultsMap[m.id])
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
    .slice(0, 3)
    .map((m) => ({
      ...m,
      homeScore: resultsMap[m.id].homeScore,
      awayScore: resultsMap[m.id].awayScore,
    }));

  return NextResponse.json({
    todayMatches,
    recentResults,
    locks,
    predictionStatus,
  });
}
