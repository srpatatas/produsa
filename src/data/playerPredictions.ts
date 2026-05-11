import { User } from "@/types";

export interface PlayerMatchPrediction {
  user: User;
  homeScore: number;
  awayScore: number;
}

const players: User[] = [
  { id: "fede", name: "Fede", avatar: "🧉" },
  { id: "nico", name: "Nico", avatar: "🎸" },
  { id: "mati", name: "Mati", avatar: "🏄" },
  { id: "sofi", name: "Sofi", avatar: "🎨" },
  { id: "default-user", name: "Player 1", avatar: "⚽" },
  { id: "juan", name: "Juanchi", avatar: "🥁" },
  { id: "caro", name: "Caro", avatar: "🌸" },
  { id: "tincho", name: "Tincho", avatar: "🧢" },
];

const mockPredictionsByMatch: Record<
  string,
  Record<string, [number, number]>
> = {
  "A-1": {
    fede: [2, 0],
    nico: [1, 1],
    mati: [3, 1],
    sofi: [1, 0],
    "default-user": [2, 1],
    juan: [0, 1],
    caro: [1, 0],
    tincho: [0, 0],
  },
  "A-2": {
    fede: [1, 2],
    nico: [0, 1],
    mati: [1, 1],
    sofi: [0, 2],
    "default-user": [1, 0],
    juan: [2, 1],
    caro: [0, 0],
    tincho: [1, 3],
  },
};

export function getPlayerPredictions(
  matchId: string,
): PlayerMatchPrediction[] {
  const matchPreds = mockPredictionsByMatch[matchId];
  if (!matchPreds) return [];

  return players
    .filter((p) => matchPreds[p.id])
    .map((p) => ({
      user: p,
      homeScore: matchPreds[p.id][0],
      awayScore: matchPreds[p.id][1],
    }));
}
