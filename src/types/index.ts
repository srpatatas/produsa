export interface Team {
  id: string;
  name: string;
  shortName: string;
  flagCode: string;
  confederation: string;
}

export type GroupId =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

export interface Group {
  id: GroupId;
  teams: [string, string, string, string];
}

export interface Match {
  id: string;
  groupId: GroupId;
  homeTeamId: string;
  awayTeamId: string;
  matchday: 1 | 2 | 3;
  kickoff: string;
  venue: string;
  city: string;
}

export interface Prediction {
  matchId: string;
  homeScore: number;
  awayScore: number;
  timestamp: number;
}

export interface PredictionsMap {
  [matchId: string]: Prediction;
}

export interface TeamStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface LeaderboardEntry {
  user: User;
  points: number;
  correctScores: number;
  correctOutcomes: number;
  previousRank: number | null;
}
