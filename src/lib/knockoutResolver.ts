import { KnockoutMatch, TeamSlot } from "@/types";
import { matchResults as staticResults } from "@/data/results";
import type { MatchResult } from "@/data/results";
import { groups } from "@/data/groups";
import { matches as groupMatches } from "@/data/matches";
import { knockoutMatches } from "@/data/knockoutMatches";
import { computeStandings } from "./scoring";

// Live results override static ones — set from API calls at runtime
let liveResults: Record<string, MatchResult> = {};

export function setLiveResults(results: Record<string, MatchResult>) {
  liveResults = results;
}

function getResults(): Record<string, MatchResult> {
  return Object.keys(liveResults).length > 0 ? liveResults : staticResults;
}

function getGroupStandings(groupId: string): string[] | null {
  const results = getResults();
  const group = groups.find((g) => g.id === groupId);
  if (!group) return null;

  const gMatches = groupMatches.filter((m) => m.groupId === groupId);
  const allPlayed = gMatches.every((m) => results[m.id]);
  if (!allPlayed) return null;

  const standings = computeStandings([...group.teams], gMatches, results);
  return standings.map((s) => s.teamId);
}

function resolveGroupPosition(ref: string): string | null {
  const position = parseInt(ref[0], 10);
  const groupId = ref.slice(1);
  const standings = getGroupStandings(groupId);
  if (!standings) return null;
  return standings[position - 1] ?? null;
}

// Cache best-third assignment so each team is assigned to exactly one R32 slot
let bestThirdCache: { results: Record<string, string>; key: string } | null = null;

function computeBestThirdAssignment(): Record<string, string> | null {
  const results = getResults();
  const allThirds: { teamId: string; groupId: string; points: number; gd: number; gf: number }[] = [];

  for (const group of groups) {
    const standings = getGroupStandings(group.id);
    if (!standings) return null;

    const gMatches = groupMatches.filter((m) => m.groupId === group.id);
    const fullStandings = computeStandings([...group.teams], gMatches, results);
    const third = fullStandings[2];
    allThirds.push({
      teamId: third.teamId,
      groupId: group.id,
      points: third.points,
      gd: third.goalDifference,
      gf: third.goalsFor,
    });
  }

  allThirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  const best8 = allThirds.slice(0, 8);

  const teamByGroup: Record<string, string> = {};
  for (const t of best8) teamByGroup[t.groupId] = t.teamId;

  // FIFA determined the actual best-third slot assignments for 2026.
  // Verified against API-Football official R32 fixtures.
  const FIFA_ASSIGNMENT: Record<string, string> = {
    "R32-3": "D",
    "R32-6": "F",
    "R32-7": "E",
    "R32-8": "K",
    "R32-9": "I",
    "R32-10": "B",
    "R32-13": "J",
    "R32-16": "L",
  };

  const assignment: Record<string, string> = {};
  for (const [slotId, groupId] of Object.entries(FIFA_ASSIGNMENT)) {
    if (teamByGroup[groupId]) {
      assignment[slotId] = teamByGroup[groupId];
    }
  }

  return assignment;
}

function resolveBestThird(ref: string, matchId?: string): string | null {
  const cacheKey = JSON.stringify(getResults());
  if (!bestThirdCache || bestThirdCache.key !== cacheKey) {
    const assignment = computeBestThirdAssignment();
    if (!assignment) return null;
    bestThirdCache = { results: assignment, key: cacheKey };
  }

  if (matchId && bestThirdCache.results[matchId]) {
    return bestThirdCache.results[matchId];
  }

  // Fallback: try to find by possible groups
  const possibleGroups = ref.slice(1).split("/");
  for (const [, teamId] of Object.entries(bestThirdCache.results)) {
    if (teamId) return teamId;
  }
  return null;
}

function resolveKnockoutWinner(ref: string): string | null {
  const results = getResults();
  const matchId = ref.slice(2);
  const match = knockoutMatches.find((m) => m.id === matchId);
  if (!match) return null;

  const resolved = resolveKnockoutMatch(match);
  if (!resolved.homeTeamId || !resolved.awayTeamId) return null;

  const result = results[matchId];
  if (!result) return null;

  if (result.homePenalty != null && result.awayPenalty != null) {
    return result.homePenalty > result.awayPenalty ? resolved.homeTeamId : resolved.awayTeamId;
  }
  if (result.homeScore > result.awayScore) return resolved.homeTeamId;
  if (result.awayScore > result.homeScore) return resolved.awayTeamId;
  return null;
}

function resolveKnockoutLoser(ref: string): string | null {
  const results = getResults();
  const matchId = ref.slice(2);
  const match = knockoutMatches.find((m) => m.id === matchId);
  if (!match) return null;

  const resolved = resolveKnockoutMatch(match);
  if (!resolved.homeTeamId || !resolved.awayTeamId) return null;

  const result = results[matchId];
  if (!result) return null;

  if (result.homePenalty != null && result.awayPenalty != null) {
    return result.homePenalty > result.awayPenalty ? resolved.awayTeamId : resolved.homeTeamId;
  }
  if (result.homeScore > result.awayScore) return resolved.awayTeamId;
  if (result.awayScore > result.homeScore) return resolved.homeTeamId;
  return null;
}

export function resolveTeamSlot(slot: TeamSlot, matchId?: string): string | null {
  switch (slot.type) {
    case "group-position":
      return resolveGroupPosition(slot.ref);
    case "best-third":
      return resolveBestThird(slot.ref, matchId);
    case "knockout-winner":
      return resolveKnockoutWinner(slot.ref);
    case "knockout-loser":
      return resolveKnockoutLoser(slot.ref);
    default:
      return null;
  }
}

export function resolveKnockoutMatch(match: KnockoutMatch): {
  homeTeamId: string | null;
  awayTeamId: string | null;
} {
  return {
    homeTeamId: resolveTeamSlot(match.homeSlot, match.id),
    awayTeamId: resolveTeamSlot(match.awaySlot, match.id),
  };
}

export function isKnockoutMatchPredictable(match: KnockoutMatch): boolean {
  const resolved = resolveKnockoutMatch(match);
  return resolved.homeTeamId !== null && resolved.awayTeamId !== null;
}
