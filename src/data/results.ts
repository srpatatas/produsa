// Static fallback — not used at runtime.
// Knockout resolver reads from DB via setLiveResults() in API routes.

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  homePenalty?: number;
  awayPenalty?: number;
}

export const matchResults: Record<string, MatchResult> = {};

export function getMatchResult(matchId: string): MatchResult | undefined {
  return matchResults[matchId];
}
