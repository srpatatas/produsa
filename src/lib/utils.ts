import { matches } from "@/data/matches";
import { knockoutMatches } from "@/data/knockoutMatches";
import { getTeam } from "@/data/teams";

export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export function matchLabel(matchId: string): string {
  const gMatch = matches.find((m) => m.id === matchId);
  if (gMatch) {
    return `${getTeam(gMatch.homeTeamId).shortName} vs ${getTeam(gMatch.awayTeamId).shortName}`;
  }
  const kMatch = knockoutMatches.find((m) => m.id === matchId);
  if (kMatch) {
    return `${kMatch.homeSlot.label} vs ${kMatch.awaySlot.label}`;
  }
  return matchId;
}

export function formatMatchDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatMatchTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
