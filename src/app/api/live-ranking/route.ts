import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getResults } from "@/lib/resultsService";
import { getLiveOutcome } from "@/lib/outcomeStyles";

interface LiveScoreParam {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

function getActualOutcome(homeScore: number, awayScore: number): "L" | "E" | "V" {
  return getLiveOutcome(homeScore, awayScore);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const scoresParam = req.nextUrl.searchParams.get("scores");
  if (!scoresParam) {
    return NextResponse.json({ error: "scores requerido" }, { status: 400 });
  }

  let liveScores: LiveScoreParam[];
  try {
    liveScores = JSON.parse(scoresParam);
  } catch {
    return NextResponse.json({ error: "scores inválido" }, { status: 400 });
  }

  const sql = getDb();

  const [users, predictions, comodines, matchResults, matchSettingsRows, exactScoreRows] =
    await Promise.all([
      sql`SELECT id, name, avatar FROM users WHERE pin != 'PENDING' ORDER BY name`,
      sql`SELECT user_id, match_id, outcome FROM planilla_predictions`,
      sql`SELECT user_id, scope, match_id FROM planilla_comodines`,
      getResults(),
      sql`SELECT match_id FROM match_settings WHERE exact_score = true`,
      sql`SELECT user_id, match_id, home_score, away_score FROM exact_score_predictions`,
    ]);

  const predByUser: Record<number, Record<string, string>> = {};
  for (const p of predictions) {
    const uid = p.user_id as number;
    if (!predByUser[uid]) predByUser[uid] = {};
    predByUser[uid][p.match_id as string] = p.outcome as string;
  }

  const comodinByUser: Record<number, Record<string, string>> = {};
  for (const c of comodines) {
    const uid = c.user_id as number;
    if (!comodinByUser[uid]) comodinByUser[uid] = {};
    comodinByUser[uid][c.scope as string] = c.match_id as string;
  }

  const exactByUser: Record<number, Record<string, { homeScore: number; awayScore: number }>> = {};
  for (const e of exactScoreRows) {
    const uid = e.user_id as number;
    if (!exactByUser[uid]) exactByUser[uid] = {};
    exactByUser[uid][e.match_id as string] = {
      homeScore: e.home_score as number,
      awayScore: e.away_score as number,
    };
  }

  const exactScoreMatches = new Set(matchSettingsRows.map((r) => r.match_id as string));

  const liveMatchIds = new Set(liveScores.map((s) => s.matchId));
  const liveScoreMap: Record<string, LiveScoreParam> = {};
  for (const s of liveScores) {
    liveScoreMap[s.matchId] = s;
  }

  const ranking = users.map((user) => {
    const uid = user.id as number;
    const userPreds = predByUser[uid] ?? {};
    const userComodines = comodinByUser[uid] ?? {};
    const userExact = exactByUser[uid] ?? {};

    let confirmedPoints = 0;
    let livePoints = 0;

    // Confirmed points from finalized results
    for (const [matchId, result] of Object.entries(matchResults)) {
      if (liveMatchIds.has(matchId)) continue;
      const prediction = userPreds[matchId];
      if (!prediction) continue;

      const actual = getActualOutcome(result.homeScore, result.awayScore);
      if (prediction.includes(actual)) {
        confirmedPoints += 1;
        for (const comodinMatchId of Object.values(userComodines)) {
          if (comodinMatchId === matchId) {
            confirmedPoints += 2;
            break;
          }
        }
      }
      if (exactScoreMatches.has(matchId) && userExact[matchId]) {
        const ex = userExact[matchId];
        if (ex.homeScore === result.homeScore && ex.awayScore === result.awayScore) {
          confirmedPoints += 2;
        }
      }
    }

    // Speculative points from live scores
    const livePredictions: Record<string, string> = {};
    const liveExactScores: Record<string, { home: number; away: number }> = {};
    for (const ls of liveScores) {
      const prediction = userPreds[ls.matchId];
      if (prediction) {
        livePredictions[ls.matchId] = prediction;
        const liveOutcome = getActualOutcome(ls.homeScore, ls.awayScore);
        if (prediction.includes(liveOutcome)) {
          livePoints += 1;
          for (const comodinMatchId of Object.values(userComodines)) {
            if (comodinMatchId === ls.matchId) {
              livePoints += 2;
              break;
            }
          }
        }
      }
      if (exactScoreMatches.has(ls.matchId) && userExact[ls.matchId]) {
        const ex = userExact[ls.matchId];
        liveExactScores[ls.matchId] = { home: ex.homeScore, away: ex.awayScore };
        if (ex.homeScore === ls.homeScore && ex.awayScore === ls.awayScore) {
          livePoints += 2;
        }
      }
    }

    const liveComodinMatchId = Object.values(userComodines).find((mid) =>
      liveMatchIds.has(mid),
    ) ?? null;

    return {
      user: {
        id: uid,
        name: user.name as string,
        avatar: user.avatar as string,
      },
      confirmedPoints,
      livePoints,
      totalPoints: confirmedPoints + livePoints,
      livePredictions,
      liveExactScores,
      liveComodinMatchId,
    };
  });

  // Baseline ranking: confirmed points only (pre-match positions)
  const baseline = [...ranking]
    .sort((a, b) => {
      if (b.confirmedPoints !== a.confirmedPoints) return b.confirmedPoints - a.confirmedPoints;
      return a.user.name.localeCompare(b.user.name);
    });
  const baselinePosition: Record<number, number> = {};
  baseline.forEach((entry, idx) => {
    baselinePosition[entry.user.id] = idx + 1;
  });

  // Live ranking: confirmed + speculative
  ranking.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.user.name.localeCompare(b.user.name);
  });

  const result = ranking.map((entry, idx) => ({
    ...entry,
    position: idx + 1,
    previousPosition: baselinePosition[entry.user.id] ?? idx + 1,
  }));

  return NextResponse.json({ ranking: result });
}
