import { Match, PredictionsMap, TeamStanding } from "@/types";

export function computeStandings(
  teamIds: string[],
  matches: Match[],
  predictions: PredictionsMap,
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
    const prediction = predictions[match.id];
    if (!prediction) continue;

    const home = standingsMap[match.homeTeamId];
    const away = standingsMap[match.awayTeamId];
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += prediction.homeScore;
    home.goalsAgainst += prediction.awayScore;
    away.goalsFor += prediction.awayScore;
    away.goalsAgainst += prediction.homeScore;

    if (prediction.homeScore > prediction.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (prediction.homeScore < prediction.awayScore) {
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
