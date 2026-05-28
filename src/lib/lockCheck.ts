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

function getEarliestKickoff(scope: string): number | null {
  const matchday = scope.match(/^fecha-(\d)$/)?.[1];
  if (matchday) {
    const scopeMatches = matches.filter((m) => m.matchday === parseInt(matchday));
    if (scopeMatches.length === 0) return null;
    return Math.min(...scopeMatches.map((m) => new Date(m.kickoff).getTime()));
  }

  const rounds = scope === "FINAL" ? ["3P", "F"] : [scope];
  const koMatches = knockoutMatches.filter((m) => rounds.includes(m.round));
  if (koMatches.length === 0) return null;
  return Math.min(...koMatches.map((m) => new Date(m.kickoff).getTime()));
}

export function getScopeLockTime(scope: string): string | null {
  const kickoff = getEarliestKickoff(scope);
  if (kickoff === null) return null;
  return new Date(kickoff).toISOString();
}

export async function isScopeLocked(scope: string): Promise<boolean> {
  const kickoff = getEarliestKickoff(scope);
  if (kickoff === null) return false;
  return kickoff <= Date.now();
}

export async function isMatchLocked(matchId: string): Promise<boolean> {
  const scope = getMatchScope(matchId);
  if (!scope) return false;
  return isScopeLocked(scope);
}
