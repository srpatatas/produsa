export interface LiveScore {
  matchId: string;
  homeScore: number;
  awayScore: number;
  minute: number;
}

export const mockLiveScores: Record<string, LiveScore> = {
  "B-1": { matchId: "B-1", homeScore: 2, awayScore: 1, minute: 34 },
};

export function getLiveScore(matchId: string): LiveScore | undefined {
  return mockLiveScores[matchId];
}
