import { getDb } from "./db";
import { matches } from "@/data/matches";
import { knockoutMatches } from "@/data/knockoutMatches";

function getMatchScope(matchId: string): string | null {
  const groupMatch = matches.find((m) => m.id === matchId);
  if (groupMatch) return `fecha-${groupMatch.matchday}`;

  const koMatch = knockoutMatches.find((m) => m.id === matchId);
  if (koMatch) {
    if (koMatch.round === "3P" || koMatch.round === "F") return "FINAL";
    return koMatch.round;
  }

  return null;
}

export async function isScopeLocked(scope: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    SELECT locks_at FROM lock_deadlines WHERE scope = ${scope}
  `;
  if (rows.length === 0) return false;
  return new Date(rows[0].locks_at as string).getTime() <= Date.now();
}

export async function isMatchLocked(matchId: string): Promise<boolean> {
  const scope = getMatchScope(matchId);
  if (!scope) return false;
  return isScopeLocked(scope);
}
