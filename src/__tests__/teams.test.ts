import { teams, getTeam } from "@/data/teams";

describe("teams", () => {
  it("has exactly 48 teams", () => {
    expect(Object.keys(teams)).toHaveLength(48);
  });

  it("every team has required fields", () => {
    for (const team of Object.values(teams)) {
      expect(team.id).toBeTruthy();
      expect(team.name).toBeTruthy();
      expect(team.shortName).toBeTruthy();
      expect(team.flagCode).toBeTruthy();
      expect(team.confederation).toBeTruthy();
    }
  });

  it("getTeam returns the correct team", () => {
    const arg = getTeam("ARG");
    expect(arg.name).toBe("Argentina");
    expect(arg.flagCode).toBe("ar");
  });

  it("getTeam throws for unknown team", () => {
    expect(() => getTeam("FAKE")).toThrow("Unknown team: FAKE");
  });
});
