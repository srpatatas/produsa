import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";
import { getResults } from "@/lib/resultsService";
import { syncFinishedResults } from "@/lib/resultSync";
import {
  getTodayUnifiedMatches,
  getAllUnifiedMatches,
} from "@/lib/unifiedMatches";
import { setLiveResults, isKnockoutMatchPredictable } from "@/lib/knockoutResolver";
import { getKnockoutMatchesByRound } from "@/data/knockoutMatches";
import { KnockoutRound } from "@/types";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();

  await syncFinishedResults();

  const [lockRows, predictionRows, resultsMap, bonusQuestionRows, bonusPredRows, comodinRows, matchSettingsRows, exactScoreRows] = await Promise.all([
    sql`SELECT scope, locks_at FROM lock_deadlines`,
    sql`SELECT match_id, outcome FROM planilla_predictions WHERE user_id = ${session.id}`,
    getResults(),
    sql`SELECT id, lock_scope FROM bonus_questions ORDER BY sort_order`,
    sql`SELECT question_id FROM bonus_predictions WHERE user_id = ${session.id}`,
    sql`SELECT scope, match_id FROM planilla_comodines WHERE user_id = ${session.id}`,
    sql`SELECT match_id, exact_score FROM match_settings WHERE exact_score = true`,
    sql`SELECT match_id FROM exact_score_predictions WHERE user_id = ${session.id}`,
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

  // User predictions set + detect doble (2-char outcome) per scope
  const userPredictions = new Set<string>();
  const userPredOutcomes = new Map<string, string>();
  for (const row of predictionRows) {
    userPredictions.add(row.match_id as string);
    userPredOutcomes.set(row.match_id as string, row.outcome as string);
  }

  // Comodín by scope
  const userComodines = new Set<string>();
  for (const row of comodinRows) {
    userComodines.add(row.scope as string);
  }

  // Exact score matches and user's exact predictions
  const exactScoreMatchIds = new Set(matchSettingsRows.map((r) => r.match_id as string));
  const userExactPreds = new Set(exactScoreRows.map((r) => r.match_id as string));

  // Prediction completion per scope
  const allMatches = getAllUnifiedMatches();
  const matchesByScope: Record<string, string[]> = {};
  for (const m of allMatches) {
    if (!matchesByScope[m.scope]) matchesByScope[m.scope] = [];
    matchesByScope[m.scope].push(m.id);
  }

  // Bonus questions per scope
  const bonusByScope: Record<string, string[]> = {};
  for (const bq of bonusQuestionRows) {
    const scope = bq.lock_scope as string;
    if (!bonusByScope[scope]) bonusByScope[scope] = [];
    bonusByScope[scope].push(bq.id as string);
  }
  const userBonusPreds = new Set(bonusPredRows.map((r) => r.question_id as string));

  // Prediction completion per scope (matches + bonus + extras)
  const allScopes = new Set([...Object.keys(matchesByScope), ...Object.keys(bonusByScope)]);
  const predictionStatus: Record<string, {
    total: number;
    completed: number;
    matches: { total: number; completed: number };
    bonus: { total: number; completed: number };
    comodin: boolean;
    doble: boolean;
    exacto: { total: number; completed: number } | null;
  }> = {};
  for (const scope of allScopes) {
    const matchIds = matchesByScope[scope] ?? [];
    const bonusIds = bonusByScope[scope] ?? [];
    const matchCompleted = matchIds.filter((id) => userPredictions.has(id)).length;
    const bonusCompleted = bonusIds.filter((id) => userBonusPreds.has(id)).length;

    const hasComodin = userComodines.has(scope);
    const hasDoble = matchIds.some((id) => (userPredOutcomes.get(id)?.length ?? 0) === 2);

    const scopeExactMatches = matchIds.filter((id) => exactScoreMatchIds.has(id));
    const exactoStatus = scopeExactMatches.length > 0
      ? { total: scopeExactMatches.length, completed: scopeExactMatches.filter((id) => userExactPreds.has(id)).length }
      : null;

    predictionStatus[scope] = {
      total: matchIds.length + bonusIds.length,
      completed: matchCompleted + bonusCompleted,
      matches: { total: matchIds.length, completed: matchCompleted },
      bonus: { total: bonusIds.length, completed: bonusCompleted },
      comodin: hasComodin,
      doble: hasDoble,
      exacto: exactoStatus,
    };
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

  // Knockout scope predictability — resolved server-side with live DB results
  setLiveResults(resultsMap);
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
    locks,
    predictionStatus,
    knockoutPredictable,
  });
});
