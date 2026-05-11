export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export const matchResults: Record<string, MatchResult> = {
  "A-1": { matchId: "A-1", homeScore: 1, awayScore: 0 },
};

export function getMatchResult(matchId: string): MatchResult | undefined {
  return matchResults[matchId];
}
