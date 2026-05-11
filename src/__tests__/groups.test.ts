import { groups, getGroup } from "@/data/groups";
import { teams } from "@/data/teams";

describe("groups", () => {
  it("has exactly 12 groups", () => {
    expect(groups).toHaveLength(12);
  });

  it("each group has exactly 4 teams", () => {
    for (const group of groups) {
      expect(group.teams).toHaveLength(4);
    }
  });

  it("all team IDs in groups reference valid teams", () => {
    for (const group of groups) {
      for (const teamId of group.teams) {
        expect(teams[teamId]).toBeDefined();
      }
    }
  });

  it("no team appears in more than one group", () => {
    const seen = new Set<string>();
    for (const group of groups) {
      for (const teamId of group.teams) {
        expect(seen.has(teamId)).toBe(false);
        seen.add(teamId);
      }
    }
  });

  it("all 48 teams are assigned to groups", () => {
    const allTeamIds = groups.flatMap((g) => g.teams);
    expect(allTeamIds).toHaveLength(48);
  });

  it("getGroup returns correct group", () => {
    const groupA = getGroup("A");
    expect(groupA).toBeDefined();
    expect(groupA!.teams).toContain("MEX");
  });

  it("getGroup is case-insensitive", () => {
    expect(getGroup("a")).toEqual(getGroup("A"));
  });

  it("getGroup returns undefined for invalid group", () => {
    expect(getGroup("Z")).toBeUndefined();
  });
});
