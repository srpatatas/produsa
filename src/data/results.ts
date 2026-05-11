export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export const matchResults: Record<string, MatchResult> = {
  // Group A — all finished (mock data for testing)
  "A-1": { matchId: "A-1", homeScore: 1, awayScore: 0 },  // MEX 1-0 RSA
  "A-2": { matchId: "A-2", homeScore: 2, awayScore: 1 },  // KOR 2-1 CZE
  "A-3": { matchId: "A-3", homeScore: 0, awayScore: 0 },  // CZE 0-0 RSA
  "A-4": { matchId: "A-4", homeScore: 0, awayScore: 1 },  // MEX 0-1 KOR
  "A-5": { matchId: "A-5", homeScore: 2, awayScore: 2 },  // RSA 2-2 KOR
  "A-6": { matchId: "A-6", homeScore: 3, awayScore: 0 },  // MEX 3-0 CZE
};

export function getMatchResult(matchId: string): MatchResult | undefined {
  return matchResults[matchId];
}
