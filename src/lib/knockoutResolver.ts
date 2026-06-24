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

function resolveBestThird(_ref: string): string | null {
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
  const possibleGroups = _ref.slice(1).split("/");
  const match = best8.find((t) => possibleGroups.includes(t.groupId));
  return match?.teamId ?? null;
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

export function resolveTeamSlot(slot: TeamSlot): string | null {
  switch (slot.type) {
    case "group-position":
      return resolveGroupPosition(slot.ref);
    case "best-third":
      return resolveBestThird(slot.ref);
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
    homeTeamId: resolveTeamSlot(match.homeSlot),
    awayTeamId: resolveTeamSlot(match.awaySlot),
  };
}

export function isKnockoutMatchPredictable(match: KnockoutMatch): boolean {
  const resolved = resolveKnockoutMatch(match);
  return resolved.homeTeamId !== null && resolved.awayTeamId !== null;
}
