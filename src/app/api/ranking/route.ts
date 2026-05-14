import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getResults } from "@/lib/resultsService";

function getActualOutcome(homeScore: number, awayScore: number): "L" | "E" | "V" {
  if (homeScore > awayScore) return "L";
  if (homeScore < awayScore) return "V";
  return "E";
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sql = getDb();

  const [matchResults, users, predictions, comodines] = await Promise.all([
    getResults(),
    sql`SELECT id, name, avatar FROM users WHERE pin != 'PENDING' ORDER BY name`,
    sql`SELECT user_id, match_id, outcome FROM planilla_predictions`,
    sql`SELECT user_id, scope, match_id FROM planilla_comodines`,
  ]);

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

  // Compute points per user
  const ranking = users.map((user) => {
    const uid = user.id as number;
    const userPreds = predByUser[uid] ?? {};
    const userComodines = comodinByUser[uid] ?? {};

    let points = 0;
    let correct = 0;
    let wrong = 0;
    let comodinPoints = 0;

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
    };
  });

  ranking.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.correct !== a.correct) return b.correct - a.correct;
    return a.wrong - b.wrong;
  });

  return NextResponse.json({ ranking });
}
