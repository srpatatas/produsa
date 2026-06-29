import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";
import { getAllUnifiedMatches } from "@/lib/unifiedMatches";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();

  const [predictionRows, bonusQuestionRows, bonusPredRows, comodinRows, matchSettingsRows, exactScoreRows] = await Promise.all([
    sql`SELECT match_id, outcome FROM planilla_predictions WHERE user_id = ${session.id}`,
    sql`SELECT id, lock_scope FROM bonus_questions ORDER BY sort_order`,
    sql`SELECT question_id FROM bonus_predictions WHERE user_id = ${session.id}`,
    sql`SELECT scope, match_id FROM planilla_comodines WHERE user_id = ${session.id}`,
    sql`SELECT match_id, exact_score FROM match_settings WHERE exact_score = true`,
    sql`SELECT match_id FROM exact_score_predictions WHERE user_id = ${session.id}`,
  ]);

  const userPredictions = new Set<string>();
  const userPredOutcomes = new Map<string, string>();
  for (const row of predictionRows) {
    userPredictions.add(row.match_id as string);
    userPredOutcomes.set(row.match_id as string, row.outcome as string);
  }

  const userComodines = new Set<string>();
  for (const row of comodinRows) {
    userComodines.add(row.scope as string);
  }

  const exactScoreMatchIds = new Set(matchSettingsRows.map((r) => r.match_id as string));
  const userExactPreds = new Set(exactScoreRows.map((r) => r.match_id as string));

  const allMatches = getAllUnifiedMatches();
  const matchesByScope: Record<string, string[]> = {};
  for (const m of allMatches) {
    if (!matchesByScope[m.scope]) matchesByScope[m.scope] = [];
    matchesByScope[m.scope].push(m.id);
  }

  const bonusByScope: Record<string, string[]> = {};
  for (const bq of bonusQuestionRows) {
    const scope = bq.lock_scope as string;
    if (!bonusByScope[scope]) bonusByScope[scope] = [];
    bonusByScope[scope].push(bq.id as string);
  }
  const userBonusPreds = new Set(bonusPredRows.map((r) => r.question_id as string));

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

    const isKnockoutScope = ["R32", "R16", "QF", "SF", "FINAL"].includes(scope);
    const scopeExactMatches = isKnockoutScope
      ? matchIds
      : matchIds.filter((id) => exactScoreMatchIds.has(id));
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

  return NextResponse.json({ predictionStatus });
});
