// Auto-generated from prod DB
// Last synced: 2026-06-24T21:15:49.344Z

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  homePenalty?: number;
  awayPenalty?: number;
}

export const matchResults: Record<string, MatchResult> = {
  "A-1": { matchId: "A-1", homeScore: 2, awayScore: 0 },
  "A-2": { matchId: "A-2", homeScore: 2, awayScore: 1 },
  "A-3": { matchId: "A-3", homeScore: 1, awayScore: 1 },
  "A-4": { matchId: "A-4", homeScore: 1, awayScore: 0 },
  "B-1": { matchId: "B-1", homeScore: 1, awayScore: 1 },
  "B-2": { matchId: "B-2", homeScore: 1, awayScore: 1 },
  "B-3": { matchId: "B-3", homeScore: 4, awayScore: 1 },
  "B-4": { matchId: "B-4", homeScore: 6, awayScore: 0 },
  "B-5": { matchId: "B-5", homeScore: 2, awayScore: 1 },
  "B-6": { matchId: "B-6", homeScore: 3, awayScore: 1 },
  "C-1": { matchId: "C-1", homeScore: 1, awayScore: 1 },
  "C-2": { matchId: "C-2", homeScore: 0, awayScore: 1 },
  "C-3": { matchId: "C-3", homeScore: 0, awayScore: 1 },
  "C-4": { matchId: "C-4", homeScore: 3, awayScore: 0 },
  "D-1": { matchId: "D-1", homeScore: 4, awayScore: 1 },
  "D-2": { matchId: "D-2", homeScore: 0, awayScore: 2 },
  "D-3": { matchId: "D-3", homeScore: 2, awayScore: 0 },
  "D-4": { matchId: "D-4", homeScore: 0, awayScore: 1 },
  "E-1": { matchId: "E-1", homeScore: 7, awayScore: 1 },
  "E-2": { matchId: "E-2", homeScore: 1, awayScore: 0 },
  "E-3": { matchId: "E-3", homeScore: 2, awayScore: 1 },
  "E-4": { matchId: "E-4", homeScore: 0, awayScore: 0 },
  "F-1": { matchId: "F-1", homeScore: 2, awayScore: 2 },
  "F-2": { matchId: "F-2", homeScore: 5, awayScore: 1 },
  "F-3": { matchId: "F-3", homeScore: 5, awayScore: 1 },
  "F-4": { matchId: "F-4", homeScore: 0, awayScore: 4 },
  "G-1": { matchId: "G-1", homeScore: 1, awayScore: 1 },
  "G-2": { matchId: "G-2", homeScore: 2, awayScore: 2 },
  "G-3": { matchId: "G-3", homeScore: 0, awayScore: 0 },
  "G-4": { matchId: "G-4", homeScore: 1, awayScore: 3 },
  "H-1": { matchId: "H-1", homeScore: 0, awayScore: 0 },
  "H-2": { matchId: "H-2", homeScore: 1, awayScore: 1 },
  "H-3": { matchId: "H-3", homeScore: 4, awayScore: 0 },
  "H-4": { matchId: "H-4", homeScore: 2, awayScore: 2 },
  "I-1": { matchId: "I-1", homeScore: 3, awayScore: 1 },
  "I-2": { matchId: "I-2", homeScore: 1, awayScore: 4 },
  "I-3": { matchId: "I-3", homeScore: 3, awayScore: 0 },
  "I-4": { matchId: "I-4", homeScore: 3, awayScore: 2 },
  "J-1": { matchId: "J-1", homeScore: 3, awayScore: 0 },
  "J-2": { matchId: "J-2", homeScore: 3, awayScore: 1 },
  "J-3": { matchId: "J-3", homeScore: 2, awayScore: 0 },
  "J-4": { matchId: "J-4", homeScore: 1, awayScore: 2 },
  "K-1": { matchId: "K-1", homeScore: 1, awayScore: 1 },
  "K-2": { matchId: "K-2", homeScore: 1, awayScore: 3 },
  "K-3": { matchId: "K-3", homeScore: 5, awayScore: 0 },
  "K-4": { matchId: "K-4", homeScore: 1, awayScore: 0 },
  "L-1": { matchId: "L-1", homeScore: 4, awayScore: 2 },
  "L-2": { matchId: "L-2", homeScore: 1, awayScore: 0 },
  "L-3": { matchId: "L-3", homeScore: 0, awayScore: 0 },
  "L-4": { matchId: "L-4", homeScore: 0, awayScore: 1 },
};

export function getMatchResult(matchId: string): MatchResult | undefined {
  return matchResults[matchId];
}
