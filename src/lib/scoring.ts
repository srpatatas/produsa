import { Match, TeamStanding } from "@/types";

export interface ScoreEntry {
  homeScore: number;
  awayScore: number;
}

export function computeStandings(
  teamIds: string[],
  matches: Match[],
  scores: Record<string, ScoreEntry>,
): TeamStanding[] {
  const standingsMap: Record<string, TeamStanding> = {};

  for (const teamId of teamIds) {
    standingsMap[teamId] = {
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  }

  for (const match of matches) {
    const score = scores[match.id];
    if (!score) continue;

    const home = standingsMap[match.homeTeamId];
    const away = standingsMap[match.awayTeamId];
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += score.homeScore;
    home.goalsAgainst += score.awayScore;
    away.goalsFor += score.awayScore;
    away.goalsAgainst += score.homeScore;

    if (score.homeScore > score.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (score.homeScore < score.awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  const standings = Object.values(standingsMap);
  for (const s of standings) {
    s.goalDifference = s.goalsFor - s.goalsAgainst;
  }

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return standings;
}
