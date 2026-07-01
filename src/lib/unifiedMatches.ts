import { UnifiedMatch } from "@/types";
import { matches } from "@/data/matches";
import { knockoutMatches } from "@/data/knockoutMatches";
import { getTeam } from "@/data/teams";
import { resolveKnockoutMatch } from "./knockoutResolver";

const LIVE_WINDOW_MS = 4 * 60 * 60 * 1000;
const ARGENTINA_OFFSET_MS = -3 * 60 * 60 * 1000;

function groupToUnified(m: typeof matches[number]): UnifiedMatch {
  return {
    id: m.id,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    homeLabel: getTeam(m.homeTeamId).shortName,
    awayLabel: getTeam(m.awayTeamId).shortName,
    kickoff: m.kickoff,
    venue: m.venue,
    city: m.city,
    phase: "group",
    scope: `fecha-${m.matchday}`,
  };
}

function knockoutToUnified(m: typeof knockoutMatches[number]): UnifiedMatch {
  const resolved = resolveKnockoutMatch(m);
  return {
    id: m.id,
    homeTeamId: resolved.homeTeamId,
    awayTeamId: resolved.awayTeamId,
    homeLabel: resolved.homeTeamId ? getTeam(resolved.homeTeamId).shortName : m.homeSlot.label,
    awayLabel: resolved.awayTeamId ? getTeam(resolved.awayTeamId).shortName : m.awaySlot.label,
    kickoff: m.kickoff,
    venue: m.venue,
    city: m.city,
    phase: "knockout",
    scope: m.round === "3P" || m.round === "F" ? "FINAL" : m.round,
  };
}

export function getAllUnifiedMatches(): UnifiedMatch[] {
  const group = matches.map(groupToUnified);
  const knockout = knockoutMatches.map(knockoutToUnified);
  return [...group, ...knockout];
}

export function getLiveUnifiedMatches(): UnifiedMatch[] {
  const now = Date.now();
  return getAllUnifiedMatches().filter((m) => {
    const kickoff = new Date(m.kickoff).getTime();
    return now >= kickoff && now <= kickoff + LIVE_WINDOW_MS;
  });
}

export function isAnyMatchInLiveWindow(): boolean {
  return getLiveUnifiedMatches().length > 0;
}

export function getNextUnifiedMatch(): UnifiedMatch | undefined {
  const now = Date.now();
  return getAllUnifiedMatches()
    .filter((m) => new Date(m.kickoff).getTime() > now)
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0];
}

function getArgentinaDayBounds(now: number): { start: number; end: number } {
  const argNow = new Date(now + ARGENTINA_OFFSET_MS);
  const dayStart = new Date(Date.UTC(
    argNow.getUTCFullYear(),
    argNow.getUTCMonth(),
    argNow.getUTCDate(),
  ));
  const startUtc = dayStart.getTime() - ARGENTINA_OFFSET_MS;
  return { start: startUtc, end: startUtc + 24 * 60 * 60 * 1000 };
}

export function getTodayUnifiedMatches(): UnifiedMatch[] {
  const { start, end } = getArgentinaDayBounds(Date.now());
  return getAllUnifiedMatches()
    .filter((m) => {
      const k = new Date(m.kickoff).getTime();
      return k >= start && k < end;
    })
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
}

