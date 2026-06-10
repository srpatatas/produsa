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
  penaltyWinner?: "home" | "away";
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
  id: number | string;
  name: string;
  avatar: string;
  is_admin?: boolean;
  invite_code?: string;
}

export type KnockoutRound = "R32" | "R16" | "QF" | "SF" | "3P" | "F";

export interface TeamSlot {
  type: "group-position" | "best-third" | "knockout-winner" | "knockout-loser";
  ref: string;
  label: string;
}

export interface KnockoutMatch {
  id: string;
  round: KnockoutRound;
  matchNumber: number;
  homeSlot: TeamSlot;
  awaySlot: TeamSlot;
  kickoff: string;
  venue: string;
  city: string;
}

export type PlanillaOutcome = "L" | "E" | "V" | "LE" | "EV" | "LV";

export interface PlanillaPrediction {
  matchId: string;
  outcome: PlanillaOutcome;
}

export interface PlanillaPredictionsMap {
  [matchId: string]: PlanillaPrediction;
}

export type BonusSourceType = "teams" | "players" | "participants";

export interface BonusQuestion {
  id: string;
  label: string;
  subtitle?: string;
  points?: number;
  sourceType: BonusSourceType;
  lockScope: string;
}

export interface BonusPredictionsMap {
  [questionId: string]: string;
}

export interface UnifiedMatch {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeLabel: string;
  awayLabel: string;
  kickoff: string;
  venue: string;
  city: string;
  phase: "group" | "knockout";
  scope: string;
}

export interface LiveEvent {
  minute: number;
  extra?: number | null;
  type: "goal" | "red" | "yellow";
  side: "home" | "away";
  player: string;
  detail?: string;
}

export interface LiveScore {
  matchId: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  events?: LiveEvent[];
}

export interface LeaderboardEntry {
  user: User;
  points: number;
  correctScores: number;
  correctOutcomes: number;
  previousRank: number | null;
}
