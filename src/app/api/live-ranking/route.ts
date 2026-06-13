import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";
import { getResults } from "@/lib/resultsService";
import { getOutcome } from "@/lib/outcomeStyles";
import { fetchRankingMaps, fetchBonusMaps, computeMatchPoints, computeBonusPoints } from "@/lib/rankingService";

interface LiveScoreParam {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export const GET = withAuth(async (req, session) => {
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
  const bonus = await fetchBonusMaps(sql, maps.users);

  const ranking = maps.users.map((user) => {
    const uid = user.id;
    const userPreds = maps.predByUser[uid] ?? {};
    const userComodines = maps.comodinByUser[uid] ?? {};
    const userExact = maps.exactByUser[uid] ?? {};

    const confirmed = computeMatchPoints(uid, matchResults, maps, liveMatchIds);
    const bonusPoints = computeBonusPoints(uid, bonus);

    let livePoints = 0;
    const livePredictions: Record<string, string> = {};
    const liveExactScores: Record<string, { home: number; away: number }> = {};

    for (const ls of liveScores) {
      const prediction = userPreds[ls.matchId];
      const hasRealScore = ls.homeScore >= 0 && ls.awayScore >= 0;
      if (prediction) {
        livePredictions[ls.matchId] = prediction;
        if (hasRealScore) {
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
      }
      if (maps.exactScoreMatches.has(ls.matchId) && userExact[ls.matchId]) {
        const ex = userExact[ls.matchId];
        liveExactScores[ls.matchId] = { home: ex.homeScore, away: ex.awayScore };
        if (hasRealScore && ex.homeScore === ls.homeScore && ex.awayScore === ls.awayScore) {
          livePoints += 2;
        }
      }
    }

    const liveComodinMatchId = Object.values(userComodines).find((mid) =>
      liveMatchIds.has(mid),
    ) ?? null;

    return {
      user: { id: uid, name: user.name, avatar: user.avatar },
      confirmedPoints: confirmed.points + bonusPoints,
      livePoints,
      totalPoints: confirmed.points + bonusPoints + livePoints,
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
});
