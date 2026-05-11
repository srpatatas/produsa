import { matches, getMatchesForGroup, isMatchLocked, isMatchLive } from "@/data/matches";
import { groups } from "@/data/groups";
import { Match } from "@/types";

describe("matches", () => {
  it("has exactly 72 group stage matches", () => {
    expect(matches).toHaveLength(72);
  });

  it("each group has exactly 6 matches", () => {
    for (const group of groups) {
      const groupMatches = getMatchesForGroup(group.id);
      expect(groupMatches).toHaveLength(6);
    }
  });

  it("each group has 2 matches per matchday", () => {
    for (const group of groups) {
      const groupMatches = getMatchesForGroup(group.id);
      for (const md of [1, 2, 3] as const) {
        const matchdayMatches = groupMatches.filter((m) => m.matchday === md);
        expect(matchdayMatches).toHaveLength(2);
      }
    }
  });

  it("every match references valid team IDs from its group", () => {
    for (const group of groups) {
      const groupMatches = getMatchesForGroup(group.id);
      for (const match of groupMatches) {
        expect(group.teams).toContain(match.homeTeamId);
        expect(group.teams).toContain(match.awayTeamId);
        expect(match.homeTeamId).not.toBe(match.awayTeamId);
      }
    }
  });

  it("every team in a group plays exactly 3 matches", () => {
    for (const group of groups) {
      const groupMatches = getMatchesForGroup(group.id);
      for (const teamId of group.teams) {
        const teamMatches = groupMatches.filter(
          (m) => m.homeTeamId === teamId || m.awayTeamId === teamId,
        );
        expect(teamMatches).toHaveLength(3);
      }
    }
  });

  it("each pair of teams in a group plays exactly once", () => {
    for (const group of groups) {
      const groupMatches = getMatchesForGroup(group.id);
      const pairs = new Set<string>();
      for (const match of groupMatches) {
        const pair = [match.homeTeamId, match.awayTeamId].sort().join("-");
        expect(pairs.has(pair)).toBe(false);
        pairs.add(pair);
      }
      expect(pairs.size).toBe(6);
    }
  });

  it("all matches have valid kickoff times", () => {
    for (const match of matches) {
      const date = new Date(match.kickoff);
      expect(date.getTime()).not.toBeNaN();
    }
  });
});

describe("isMatchLocked", () => {
  it("returns true for a match in the past", () => {
    const pastMatch: Match = {
      id: "test",
      groupId: "A",
      homeTeamId: "MEX",
      awayTeamId: "RSA",
      matchday: 1,
      kickoff: "2020-01-01T00:00:00Z",
      venue: "Test",
      city: "Test",
    };
    expect(isMatchLocked(pastMatch)).toBe(true);
  });

  it("returns false for a match in the future", () => {
    const futureMatch: Match = {
      id: "test",
      groupId: "A",
      homeTeamId: "MEX",
      awayTeamId: "RSA",
      matchday: 1,
      kickoff: "2099-01-01T00:00:00Z",
      venue: "Test",
      city: "Test",
    };
    expect(isMatchLocked(futureMatch)).toBe(false);
  });
});

describe("isMatchLive", () => {
  it("returns false for a match in the far future", () => {
    const futureMatch: Match = {
      id: "test",
      groupId: "A",
      homeTeamId: "MEX",
      awayTeamId: "RSA",
      matchday: 1,
      kickoff: "2099-01-01T00:00:00Z",
      venue: "Test",
      city: "Test",
    };
    expect(isMatchLive(futureMatch)).toBe(false);
  });

  it("returns false for a match that ended long ago", () => {
    const pastMatch: Match = {
      id: "test",
      groupId: "A",
      homeTeamId: "MEX",
      awayTeamId: "RSA",
      matchday: 1,
      kickoff: "2020-01-01T00:00:00Z",
      venue: "Test",
      city: "Test",
    };
    expect(isMatchLive(pastMatch)).toBe(false);
  });

  it("returns true for a match that started 30 minutes ago", () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - 30);
    const liveMatch: Match = {
      id: "test",
      groupId: "A",
      homeTeamId: "MEX",
      awayTeamId: "RSA",
      matchday: 1,
      kickoff: now.toISOString(),
      venue: "Test",
      city: "Test",
    };
    expect(isMatchLive(liveMatch)).toBe(true);
  });

  it("returns false for a match that started 181 minutes ago", () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - 181);
    const endedMatch: Match = {
      id: "test",
      groupId: "A",
      homeTeamId: "MEX",
      awayTeamId: "RSA",
      matchday: 1,
      kickoff: now.toISOString(),
      venue: "Test",
      city: "Test",
    };
    expect(isMatchLive(endedMatch)).toBe(false);
  });
});
