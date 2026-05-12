import { PlanillaPredictionsMap } from "@/types";

// Results: A-1 MEX 1-0 RSA (L), A-2 KOR 2-1 CZE (L), A-3 CZE 0-0 RSA (E)
//          A-4 MEX 0-1 KOR (V), A-5 RSA 2-2 KOR (E), A-6 MEX 3-0 CZE (L)
export const defaultPlanillaPredictions: PlanillaPredictionsMap = {
  "A-1": { matchId: "A-1", outcome: "L" },   // ✓ correct (MEX won)
  "A-2": { matchId: "A-2", outcome: "EV" },  // ✗ wrong (KOR won = L)
  "A-3": { matchId: "A-3", outcome: "LE" },  // ✓ doble correct (draw = E)
  "A-4": { matchId: "A-4", outcome: "L" },   // ✗ wrong (KOR won = V)
  "A-5": { matchId: "A-5", outcome: "E" },   // ✓ correct (draw)
  "A-6": { matchId: "A-6", outcome: "V" },   // ✗ wrong (MEX won = L)
};
