import { NextResponse } from "next/server";
import { getResults } from "@/lib/resultsService";
import { knockoutMatches } from "@/data/knockoutMatches";
import { setLiveResults, resolveKnockoutMatch, isKnockoutMatchPredictable } from "@/lib/knockoutResolver";

export const dynamic = "force-dynamic";

export async function GET() {
  const results = await getResults();
  setLiveResults(results);

  const resolved = knockoutMatches.map((m) => {
    const teams = resolveKnockoutMatch(m);
    return {
      id: m.id,
      round: m.round,
      matchNumber: m.matchNumber,
      homeTeamId: teams.homeTeamId,
      awayTeamId: teams.awayTeamId,
      predictable: isKnockoutMatchPredictable(m),
    };
  });

  return NextResponse.json({ matches: resolved }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
