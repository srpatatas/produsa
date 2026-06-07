import { fixtureToMatch } from "@/data/fixtureMap";

const API_BASE = "https://v3.football.api-sports.io";
const LIVE_STATUSES = "1H-HT-2H-ET-P-BT-LIVE";

const FIXTURE_IDS = new Set(Object.keys(fixtureToMatch).map(Number));

export interface LiveScoreResult {
  homeScore: number;
  awayScore: number;
  minute: number;
  status: string;
}

export async function fetchLiveScores(
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<Record<string, LiveScoreResult>> {
  const res = await fetchFn(
    `${API_BASE}/fixtures?league=1&season=2026&status=${LIVE_STATUSES}`,
    { headers: { "x-apisports-key": apiKey } },
  );

  if (!res.ok) return {};

  const data = await res.json();
  const scores: Record<string, LiveScoreResult> = {};

  for (const f of data.response) {
    const fixtureId = f.fixture.id as number;
    if (!FIXTURE_IDS.has(fixtureId)) continue;

    const matchId = fixtureToMatch[fixtureId];
    scores[matchId] = {
      homeScore: f.goals.home ?? 0,
      awayScore: f.goals.away ?? 0,
      minute: f.fixture.status.elapsed ?? 0,
      status: f.fixture.status.short,
    };
  }

  return scores;
}
