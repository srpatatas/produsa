import { PredictionsMap } from "@/types";

export const defaultUserPredictions: PredictionsMap = {
  // Group A — all finished
  "A-1": { matchId: "A-1", homeScore: 2, awayScore: 1, timestamp: 0 },  // result 1-0 → acertaste
  "A-2": { matchId: "A-2", homeScore: 1, awayScore: 0, timestamp: 0 },  // result 2-1 → acertaste
  "A-3": { matchId: "A-3", homeScore: 1, awayScore: 1, timestamp: 0 },  // result 0-0 → acertaste (draw)
  "A-4": { matchId: "A-4", homeScore: 1, awayScore: 1, timestamp: 0 },  // result 0-1 → fallaste
  "A-5": { matchId: "A-5", homeScore: 2, awayScore: 2, timestamp: 0 },  // result 2-2 → exacto!
  "A-6": { matchId: "A-6", homeScore: 3, awayScore: 0, timestamp: 0 },  // result 3-0 → exacto!
};
