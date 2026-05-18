import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";
import { MatchResult } from "@/data/results";
import { fetchRankingMaps, fetchBonusMaps, computeMatchPoints, computeBonusPoints } from "@/lib/rankingService";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();

  const [maps, resultsRows] = await Promise.all([
    fetchRankingMaps(sql),
    sql`SELECT match_id, home_score, away_score FROM match_results`,
  ]);

  const matchResults: Record<string, MatchResult> = {};
  for (const r of resultsRows) {
    matchResults[r.match_id as string] = {
      matchId: r.match_id as string,
      homeScore: r.home_score as number,
      awayScore: r.away_score as number,
    };
  }

  const bonus = await fetchBonusMaps(sql, maps.users);

  const ranking = maps.users.map((user) => {
    const mp = computeMatchPoints(user.id, matchResults, maps);
    const bonusPoints = computeBonusPoints(user.id, bonus);

    return {
      user: { id: user.id, name: user.name, avatar: user.avatar },
      points: mp.points + bonusPoints,
      correct: mp.correct,
      wrong: mp.wrong,
      comodinPoints: mp.comodinPoints,
      exactScorePoints: mp.exactScorePoints,
      bonusPoints,
    };
  });

  ranking.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.correct !== a.correct) return b.correct - a.correct;
    return a.wrong - b.wrong;
  });

  return NextResponse.json({ ranking });
});
