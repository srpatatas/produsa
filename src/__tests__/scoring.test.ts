import { computeStandings } from "@/lib/scoring";
import { Match, PredictionsMap } from "@/types";

const teamIds = ["A", "B", "C", "D"];

const matches: Match[] = [
  { id: "1", groupId: "A", homeTeamId: "A", awayTeamId: "B", matchday: 1, kickoff: "", venue: "", city: "" },
  { id: "2", groupId: "A", homeTeamId: "C", awayTeamId: "D", matchday: 1, kickoff: "", venue: "", city: "" },
  { id: "3", groupId: "A", homeTeamId: "A", awayTeamId: "C", matchday: 2, kickoff: "", venue: "", city: "" },
  { id: "4", groupId: "A", homeTeamId: "B", awayTeamId: "D", matchday: 2, kickoff: "", venue: "", city: "" },
  { id: "5", groupId: "A", homeTeamId: "A", awayTeamId: "D", matchday: 3, kickoff: "", venue: "", city: "" },
  { id: "6", groupId: "A", homeTeamId: "B", awayTeamId: "C", matchday: 3, kickoff: "", venue: "", city: "" },
];

describe("computeStandings", () => {
  it("returns all teams with zero stats when no predictions exist", () => {
    const standings = computeStandings(teamIds, matches, {});
    expect(standings).toHaveLength(4);
    for (const s of standings) {
      expect(s.played).toBe(0);
      expect(s.points).toBe(0);
    }
  });

  it("awards 3 points for a win", () => {
    const predictions: PredictionsMap = {
      "1": { matchId: "1", homeScore: 2, awayScore: 0, timestamp: 0 },
    };
    const standings = computeStandings(teamIds, matches, predictions);
    const teamA = standings.find((s) => s.teamId === "A")!;
    const teamB = standings.find((s) => s.teamId === "B")!;
    expect(teamA.points).toBe(3);
    expect(teamA.won).toBe(1);
    expect(teamB.points).toBe(0);
    expect(teamB.lost).toBe(1);
  });

  it("awards 1 point each for a draw", () => {
    const predictions: PredictionsMap = {
      "1": { matchId: "1", homeScore: 1, awayScore: 1, timestamp: 0 },
    };
    const standings = computeStandings(teamIds, matches, predictions);
    const teamA = standings.find((s) => s.teamId === "A")!;
    const teamB = standings.find((s) => s.teamId === "B")!;
    expect(teamA.points).toBe(1);
    expect(teamA.drawn).toBe(1);
    expect(teamB.points).toBe(1);
    expect(teamB.drawn).toBe(1);
  });

  it("calculates goal difference correctly", () => {
    const predictions: PredictionsMap = {
      "1": { matchId: "1", homeScore: 3, awayScore: 1, timestamp: 0 },
    };
    const standings = computeStandings(teamIds, matches, predictions);
    const teamA = standings.find((s) => s.teamId === "A")!;
    expect(teamA.goalsFor).toBe(3);
    expect(teamA.goalsAgainst).toBe(1);
    expect(teamA.goalDifference).toBe(2);
  });

  it("sorts by points, then goal difference, then goals scored", () => {
    const predictions: PredictionsMap = {
      "1": { matchId: "1", homeScore: 3, awayScore: 0, timestamp: 0 },
      "2": { matchId: "2", homeScore: 1, awayScore: 0, timestamp: 0 },
    };
    const standings = computeStandings(teamIds, matches, predictions);
    expect(standings[0].teamId).toBe("A");
    expect(standings[1].teamId).toBe("C");
    expect(standings[0].points).toBe(standings[1].points);
    expect(standings[0].goalDifference).toBeGreaterThan(standings[1].goalDifference);
  });

  it("computes full group correctly with all 6 matches", () => {
    const predictions: PredictionsMap = {
      "1": { matchId: "1", homeScore: 2, awayScore: 1, timestamp: 0 },
      "2": { matchId: "2", homeScore: 0, awayScore: 0, timestamp: 0 },
      "3": { matchId: "3", homeScore: 1, awayScore: 0, timestamp: 0 },
      "4": { matchId: "4", homeScore: 1, awayScore: 2, timestamp: 0 },
      "5": { matchId: "5", homeScore: 3, awayScore: 0, timestamp: 0 },
      "6": { matchId: "6", homeScore: 0, awayScore: 1, timestamp: 0 },
    };
    const standings = computeStandings(teamIds, matches, predictions);
    const teamA = standings.find((s) => s.teamId === "A")!;
    expect(teamA.played).toBe(3);
    expect(teamA.won).toBe(3);
    expect(teamA.points).toBe(9);
    expect(standings[0].teamId).toBe("A");
  });
});
