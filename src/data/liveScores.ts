export interface LiveScore {
  matchId: string;
  homeScore: number;
  awayScore: number;
  minute: number;
}

export const mockLiveScores: Record<string, LiveScore> = {
  "A-1": { matchId: "A-1", homeScore: 1, awayScore: 0, minute: 63 },
  "A-2": { matchId: "A-2", homeScore: 0, awayScore: 0, minute: 28 },
};

export function getLiveScore(matchId: string): LiveScore | undefined {
  return mockLiveScores[matchId];
}
