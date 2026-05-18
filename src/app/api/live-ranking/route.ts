import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getResults } from "@/lib/resultsService";
import { getOutcome } from "@/lib/outcomeStyles";
import { fetchRankingMaps, computeMatchPoints } from "@/lib/rankingService";

interface LiveScoreParam {
  matchId: string;
  homeScore: number;
  awayScore: number;
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

  const [maps, matchResults] = await Promise.all([
    fetchRankingMaps(sql),
    getResults(),
  ]);

  const liveMatchIds = new Set(liveScores.map((s) => s.matchId));

  const ranking = maps.users.map((user) => {
    const uid = user.id;
    const userPreds = maps.predByUser[uid] ?? {};
    const userComodines = maps.comodinByUser[uid] ?? {};
    const userExact = maps.exactByUser[uid] ?? {};

    const confirmed = computeMatchPoints(uid, matchResults, maps, liveMatchIds);

    let livePoints = 0;
    const livePredictions: Record<string, string> = {};
    const liveExactScores: Record<string, { home: number; away: number }> = {};

    for (const ls of liveScores) {
      const prediction = userPreds[ls.matchId];
      if (prediction) {
        livePredictions[ls.matchId] = prediction;
        const liveOutcome = getOutcome(ls.homeScore, ls.awayScore);
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
      if (maps.exactScoreMatches.has(ls.matchId) && userExact[ls.matchId]) {
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
      user: { id: uid, name: user.name, avatar: user.avatar },
      confirmedPoints: confirmed.points,
      livePoints,
      totalPoints: confirmed.points + livePoints,
      livePredictions,
      liveExactScores,
      liveComodinMatchId,
    };
  });

  const baseline = [...ranking]
    .sort((a, b) => {
      if (b.confirmedPoints !== a.confirmedPoints) return b.confirmedPoints - a.confirmedPoints;
      return a.user.name.localeCompare(b.user.name);
    });
  const baselinePosition: Record<number, number> = {};
  baseline.forEach((entry, idx) => {
    baselinePosition[entry.user.id] = idx + 1;
  });

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
