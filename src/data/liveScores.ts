export interface LiveScore {
  matchId: string;
  homeScore: number;
  awayScore: number;
  minute: number;
}

const scoreSequence: LiveScore[] = [
  { matchId: "B-1", homeScore: 0, awayScore: 0, minute: 12 },
  { matchId: "B-1", homeScore: 1, awayScore: 0, minute: 23 },
  { matchId: "B-1", homeScore: 1, awayScore: 1, minute: 37 },
  { matchId: "B-1", homeScore: 2, awayScore: 1, minute: 55 },
  { matchId: "B-1", homeScore: 2, awayScore: 2, minute: 68 },
  { matchId: "B-1", homeScore: 3, awayScore: 2, minute: 82 },
];

const CYCLE_INTERVAL_MS = 8000;

export function getLiveScore(matchId: string): LiveScore | undefined {
  if (matchId !== "B-1") return undefined;
  const index = Math.floor(Date.now() / CYCLE_INTERVAL_MS) % scoreSequence.length;
  return scoreSequence[index];
}
