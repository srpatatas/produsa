import { LeaderboardEntry } from "@/types";

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    user: { id: "fede", name: "Fede", avatar: "🧉" },
    points: 18,
    correctScores: 3,
    correctOutcomes: 6,
    previousRank: 2,
  },
  {
    user: { id: "nico", name: "Nico", avatar: "🎸" },
    points: 15,
    correctScores: 2,
    correctOutcomes: 5,
    previousRank: 1,
  },
  {
    user: { id: "mati", name: "Mati", avatar: "🏄" },
    points: 14,
    correctScores: 2,
    correctOutcomes: 4,
    previousRank: 5,
  },
  {
    user: { id: "sofi", name: "Sofi", avatar: "🎨" },
    points: 12,
    correctScores: 1,
    correctOutcomes: 5,
    previousRank: 3,
  },
  {
    user: { id: "default-user", name: "Player 1", avatar: "⚽" },
    points: 11,
    correctScores: 1,
    correctOutcomes: 4,
    previousRank: 4,
  },
  {
    user: { id: "juan", name: "Juanchi", avatar: "🥁" },
    points: 9,
    correctScores: 1,
    correctOutcomes: 3,
    previousRank: 7,
  },
  {
    user: { id: "caro", name: "Caro", avatar: "🌸" },
    points: 8,
    correctScores: 0,
    correctOutcomes: 4,
    previousRank: 6,
  },
  {
    user: { id: "tincho", name: "Tincho", avatar: "🧢" },
    points: 5,
    correctScores: 0,
    correctOutcomes: 2,
    previousRank: 8,
  },
];
