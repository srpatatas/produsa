import { NextResponse } from "next/server";

const API_BASE = "https://v3.football.api-sports.io";

const FIXTURE_TO_MATCH: Record<number, string> = {
  1525713: "B-1",
};

const FIXTURE_IDS = new Set(Object.keys(FIXTURE_TO_MATCH).map(Number));

export async function GET() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return NextResponse.json({ scores: {} });
  }

  const res = await fetch(`${API_BASE}/fixtures?live=all`, {
    headers: { "x-apisports-key": key },
  });

  if (!res.ok) {
    return NextResponse.json({ scores: {} });
  }

  const data = await res.json();
  const scores: Record<string, { homeScore: number; awayScore: number; minute: number; status: string }> = {};

  for (const f of data.response) {
    const fixtureId = f.fixture.id as number;
    if (!FIXTURE_IDS.has(fixtureId)) continue;

    const matchId = FIXTURE_TO_MATCH[fixtureId];
    scores[matchId] = {
      homeScore: f.goals.home ?? 0,
      awayScore: f.goals.away ?? 0,
      minute: f.fixture.status.elapsed ?? 0,
      status: f.fixture.status.short,
    };
  }

  return NextResponse.json({ scores });
}
