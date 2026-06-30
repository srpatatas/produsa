import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

import { MatchResult } from "@/data/results";
import { fetchRankingMaps, fetchBonusMaps, computeMatchPoints, computeBonusPoints } from "@/lib/rankingService";

let rankingCache: { data: unknown; time: number } | null = null;
const RANKING_CACHE_TTL = 30_000;

export const GET = withAuth(async (req, session) => {
  if (rankingCache && Date.now() - rankingCache.time < RANKING_CACHE_TTL) {
    return NextResponse.json(rankingCache.data);
  }

  const sql = getDb();

  const [maps, resultsRows] = await Promise.all([
    fetchRankingMaps(sql),
    sql`SELECT match_id, home_score, away_score, home_penalty, away_penalty FROM match_results`,
  ]);

  const matchResults: Record<string, MatchResult> = {};
  for (const r of resultsRows) {
    const mr: MatchResult = {
      matchId: r.match_id as string,
      homeScore: r.home_score as number,
      awayScore: r.away_score as number,
    };
    if (r.home_penalty != null) mr.homePenalty = r.home_penalty as number;
    if (r.away_penalty != null) mr.awayPenalty = r.away_penalty as number;
    matchResults[r.match_id as string] = mr;
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

  const response = { ranking };
  rankingCache = { data: response, time: Date.now() };
  return NextResponse.json(response, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=120, stale-while-revalidate=600" },
  });
});
