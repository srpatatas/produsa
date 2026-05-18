export interface AdminUser {
  id: number;
  name: string;
  invite_code: string;
  avatar: string;
  is_admin: boolean;
  registered: boolean;
  created_at: string;
}

export interface UserPredictions {
  predictions: { match_id: string; outcome: string }[];
  comodines: { scope: string; match_id: string }[];
  bonus: { question_id: string; answer: string }[];
}

export interface MatchResultEntry {
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export const groupAccents: Record<string, string> = {
  A: "from-fifa-green to-fifa-teal",
  B: "from-fifa-red to-rose-600",
  C: "from-fifa-blue to-indigo-600",
  D: "from-fifa-purple to-fuchsia-600",
  E: "from-amber-500 to-fifa-gold",
  F: "from-fifa-teal to-cyan-500",
  G: "from-fifa-red to-fifa-purple",
  H: "from-fifa-blue to-fifa-green",
  I: "from-fifa-purple to-fifa-blue",
  J: "from-fifa-green to-lime-500",
  K: "from-fifa-gold to-amber-600",
  L: "from-fifa-red to-fifa-blue",
};
