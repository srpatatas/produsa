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
  // Group A
  "A-1": {
    fede: [1, 0], nico: [2, 0], mati: [1, 1], sofi: [1, 0],
    "default-user": [2, 1], juan: [0, 1], caro: [1, 0], tincho: [0, 0],
  },
  "A-2": {
    fede: [1, 2], nico: [0, 1], mati: [2, 1], sofi: [0, 2],
    "default-user": [1, 0], juan: [2, 1], caro: [0, 0], tincho: [1, 1],
  },
  "A-3": {
    fede: [1, 0], nico: [0, 0], mati: [1, 2], sofi: [0, 1],
    "default-user": [1, 1], juan: [0, 0], caro: [2, 1], tincho: [0, 0],
  },
  "A-4": {
    fede: [2, 0], nico: [1, 0], mati: [0, 0], sofi: [3, 1],
    "default-user": [1, 1], juan: [0, 1], caro: [2, 0], tincho: [1, 0],
  },
  "A-5": {
    fede: [0, 1], nico: [1, 2], mati: [0, 3], sofi: [1, 1],
    "default-user": [0, 2], juan: [1, 3], caro: [0, 1], tincho: [2, 2],
  },
  "A-6": {
    fede: [2, 0], nico: [3, 0], mati: [2, 1], sofi: [1, 0],
    "default-user": [3, 0], juan: [1, 0], caro: [2, 0], tincho: [0, 1],
  },
  // Group B — live
  "B-1": {
    fede: [1, 0], nico: [2, 1], mati: [0, 0], sofi: [1, 2],
    "default-user": [2, 1], juan: [3, 0], caro: [1, 1], tincho: [0, 2],
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
