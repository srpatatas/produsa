import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { MatchResult } from "@/data/results";

function getActualOutcome(homeScore: number, awayScore: number): "L" | "E" | "V" {
  if (homeScore > awayScore) return "L";
  if (homeScore < awayScore) return "V";
  return "E";
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sql = getDb();

  const [resultsRows, users, predictions, comodines, exactScoreRows, matchSettingsRows] = await Promise.all([
    sql`SELECT match_id, home_score, away_score FROM match_results`,
    sql`SELECT id, name, avatar FROM users WHERE pin != 'PENDING' ORDER BY name`,
    sql`SELECT user_id, match_id, outcome FROM planilla_predictions`,
    sql`SELECT user_id, scope, match_id FROM planilla_comodines`,
    sql`SELECT user_id, match_id, home_score, away_score FROM exact_score_predictions`,
    sql`SELECT match_id FROM match_settings WHERE exact_score = true`,
  ]);

  const matchResults: Record<string, MatchResult> = {};
  for (const r of resultsRows) {
    matchResults[r.match_id as string] = {
      matchId: r.match_id as string,
      homeScore: r.home_score as number,
      awayScore: r.away_score as number,
    };
  }

  // Build predictions map per user
  const predByUser: Record<number, Record<string, string>> = {};
  for (const p of predictions) {
    const uid = p.user_id as number;
    if (!predByUser[uid]) predByUser[uid] = {};
    predByUser[uid][p.match_id as string] = p.outcome as string;
  }

  // Build comodines map per user: scope → matchId
  const comodinByUser: Record<number, Record<string, string>> = {};
  for (const c of comodines) {
    const uid = c.user_id as number;
    if (!comodinByUser[uid]) comodinByUser[uid] = {};
    comodinByUser[uid][c.scope as string] = c.match_id as string;
  }

  // Build exact score predictions per user
  const exactByUser: Record<number, Record<string, { homeScore: number; awayScore: number }>> = {};
  for (const e of exactScoreRows) {
    const uid = e.user_id as number;
    if (!exactByUser[uid]) exactByUser[uid] = {};
    exactByUser[uid][e.match_id as string] = {
      homeScore: e.home_score as number,
      awayScore: e.away_score as number,
    };
  }

  // Set of matches with exact score enabled
  const exactScoreMatches = new Set(matchSettingsRows.map((r) => r.match_id as string));

  // Compute points per user
  const ranking = users.map((user) => {
    const uid = user.id as number;
    const userPreds = predByUser[uid] ?? {};
    const userComodines = comodinByUser[uid] ?? {};
    const userExact = exactByUser[uid] ?? {};

    let points = 0;
    let correct = 0;
    let wrong = 0;
    let comodinPoints = 0;
    let exactScorePoints = 0;

    for (const [matchId, result] of Object.entries(matchResults)) {
      const actual = getActualOutcome(result.homeScore, result.awayScore);
      const prediction = userPreds[matchId];

      if (!prediction) {
        wrong++;
        continue;
      }

      if (prediction.includes(actual)) {
        points += 1;
        correct++;

        // Check if comodin was on this match
        for (const comodinMatchId of Object.values(userComodines)) {
          if (comodinMatchId === matchId) {
            points += 2;
            comodinPoints += 2;
            break;
          }
        }
      } else {
        wrong++;
      }

      // Exact score bonus (+2)
      if (exactScoreMatches.has(matchId) && userExact[matchId]) {
        const ex = userExact[matchId];
        if (ex.homeScore === result.homeScore && ex.awayScore === result.awayScore) {
          points += 2;
          exactScorePoints += 2;
        }
      }
    }

    return {
      user: {
        id: uid,
        name: user.name as string,
        avatar: user.avatar as string,
      },
      points,
      correct,
      wrong,
      comodinPoints,
      exactScorePoints,
    };
  });

  ranking.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.correct !== a.correct) return b.correct - a.correct;
    return a.wrong - b.wrong;
  });

  return NextResponse.json({ ranking });
}
