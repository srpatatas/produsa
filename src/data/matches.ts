import { Match } from "@/types";

export const matches: Match[] = [
  // Group A: Mexico, South Africa, South Korea, Czechia
  // MOCK: set to "now" for live preview — revert before merging to main
  { id: "A-1", groupId: "A", homeTeamId: "MEX", awayTeamId: "RSA", matchday: 1, kickoff: "2026-05-28T21:05:00Z", venue: "Estadio Azteca", city: "Ciudad de México" },
  { id: "A-2", groupId: "A", homeTeamId: "KOR", awayTeamId: "CZE", matchday: 1, kickoff: "2026-05-28T21:15:00Z", venue: "Estadio Akron", city: "Guadalajara" },
  { id: "A-3", groupId: "A", homeTeamId: "CZE", awayTeamId: "RSA", matchday: 2, kickoff: "2026-06-18T16:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { id: "A-4", groupId: "A", homeTeamId: "MEX", awayTeamId: "KOR", matchday: 2, kickoff: "2026-06-19T01:00:00Z", venue: "Estadio Akron", city: "Guadalajara" },
  { id: "A-5", groupId: "A", homeTeamId: "MEX", awayTeamId: "CZE", matchday: 3, kickoff: "2026-06-25T01:00:00Z", venue: "Estadio Azteca", city: "Ciudad de México" },
  { id: "A-6", groupId: "A", homeTeamId: "RSA", awayTeamId: "KOR", matchday: 3, kickoff: "2026-06-25T01:00:00Z", venue: "Estadio BBVA", city: "Monterrey" },

  // Group B: Canada, Bosnia-Herzegovina, Qatar, Switzerland
  { id: "B-1", groupId: "B", homeTeamId: "CAN", awayTeamId: "BIH", matchday: 1, kickoff: "2026-06-12T19:00:00Z", venue: "BMO Field", city: "Toronto" },
  { id: "B-2", groupId: "B", homeTeamId: "QAT", awayTeamId: "SUI", matchday: 1, kickoff: "2026-06-13T19:00:00Z", venue: "Levi's Stadium", city: "San Francisco" },
  { id: "B-3", groupId: "B", homeTeamId: "SUI", awayTeamId: "BIH", matchday: 2, kickoff: "2026-06-18T19:00:00Z", venue: "SoFi Stadium", city: "Los Ángeles" },
  { id: "B-4", groupId: "B", homeTeamId: "CAN", awayTeamId: "QAT", matchday: 2, kickoff: "2026-06-18T22:00:00Z", venue: "BC Place", city: "Vancouver" },
  { id: "B-5", groupId: "B", homeTeamId: "SUI", awayTeamId: "CAN", matchday: 3, kickoff: "2026-06-24T19:00:00Z", venue: "BC Place", city: "Vancouver" },
  { id: "B-6", groupId: "B", homeTeamId: "BIH", awayTeamId: "QAT", matchday: 3, kickoff: "2026-06-24T19:00:00Z", venue: "Lumen Field", city: "Seattle" },

  // Group C: Brazil, Morocco, Haiti, Scotland
  { id: "C-1", groupId: "C", homeTeamId: "BRA", awayTeamId: "MAR", matchday: 1, kickoff: "2026-06-13T22:00:00Z", venue: "MetLife Stadium", city: "Nueva Jersey" },
  { id: "C-2", groupId: "C", homeTeamId: "HAI", awayTeamId: "SCO", matchday: 1, kickoff: "2026-06-14T01:00:00Z", venue: "Gillette Stadium", city: "Boston" },
  { id: "C-3", groupId: "C", homeTeamId: "SCO", awayTeamId: "MAR", matchday: 2, kickoff: "2026-06-19T22:00:00Z", venue: "Gillette Stadium", city: "Boston" },
  { id: "C-4", groupId: "C", homeTeamId: "BRA", awayTeamId: "HAI", matchday: 2, kickoff: "2026-06-20T00:30:00Z", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { id: "C-5", groupId: "C", homeTeamId: "SCO", awayTeamId: "BRA", matchday: 3, kickoff: "2026-06-24T22:00:00Z", venue: "Hard Rock Stadium", city: "Miami" },
  { id: "C-6", groupId: "C", homeTeamId: "MAR", awayTeamId: "HAI", matchday: 3, kickoff: "2026-06-24T22:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },

  // Group D: United States, Paraguay, Turkiye, Australia
  { id: "D-1", groupId: "D", homeTeamId: "USA", awayTeamId: "PAR", matchday: 1, kickoff: "2026-06-13T01:00:00Z", venue: "SoFi Stadium", city: "Los Ángeles" },
  { id: "D-2", groupId: "D", homeTeamId: "TUR", awayTeamId: "AUS", matchday: 1, kickoff: "2026-06-14T04:00:00Z", venue: "BC Place", city: "Vancouver" },
  { id: "D-3", groupId: "D", homeTeamId: "USA", awayTeamId: "AUS", matchday: 2, kickoff: "2026-06-19T19:00:00Z", venue: "Lumen Field", city: "Seattle" },
  { id: "D-4", groupId: "D", homeTeamId: "TUR", awayTeamId: "PAR", matchday: 2, kickoff: "2026-06-20T03:00:00Z", venue: "Levi's Stadium", city: "San Francisco" },
  { id: "D-5", groupId: "D", homeTeamId: "TUR", awayTeamId: "USA", matchday: 3, kickoff: "2026-06-26T02:00:00Z", venue: "SoFi Stadium", city: "Los Ángeles" },
  { id: "D-6", groupId: "D", homeTeamId: "PAR", awayTeamId: "AUS", matchday: 3, kickoff: "2026-06-26T02:00:00Z", venue: "Levi's Stadium", city: "San Francisco" },

  // Group E: Germany, Curacao, Ivory Coast, Ecuador
  { id: "E-1", groupId: "E", homeTeamId: "GER", awayTeamId: "CUW", matchday: 1, kickoff: "2026-06-14T17:00:00Z", venue: "NRG Stadium", city: "Houston" },
  { id: "E-2", groupId: "E", homeTeamId: "CIV", awayTeamId: "ECU", matchday: 1, kickoff: "2026-06-14T23:00:00Z", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { id: "E-3", groupId: "E", homeTeamId: "GER", awayTeamId: "CIV", matchday: 2, kickoff: "2026-06-20T20:00:00Z", venue: "BMO Field", city: "Toronto" },
  { id: "E-4", groupId: "E", homeTeamId: "ECU", awayTeamId: "CUW", matchday: 2, kickoff: "2026-06-21T00:00:00Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  { id: "E-5", groupId: "E", homeTeamId: "CUW", awayTeamId: "CIV", matchday: 3, kickoff: "2026-06-25T20:00:00Z", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { id: "E-6", groupId: "E", homeTeamId: "ECU", awayTeamId: "GER", matchday: 3, kickoff: "2026-06-25T20:00:00Z", venue: "MetLife Stadium", city: "Nueva Jersey" },

  // Group F: Netherlands, Japan, Sweden, Tunisia
  { id: "F-1", groupId: "F", homeTeamId: "NED", awayTeamId: "JPN", matchday: 1, kickoff: "2026-06-14T20:00:00Z", venue: "AT&T Stadium", city: "Dallas" },
  { id: "F-2", groupId: "F", homeTeamId: "SWE", awayTeamId: "TUN", matchday: 1, kickoff: "2026-06-15T02:00:00Z", venue: "Estadio BBVA", city: "Monterrey" },
  { id: "F-3", groupId: "F", homeTeamId: "NED", awayTeamId: "SWE", matchday: 2, kickoff: "2026-06-20T17:00:00Z", venue: "NRG Stadium", city: "Houston" },
  { id: "F-4", groupId: "F", homeTeamId: "TUN", awayTeamId: "JPN", matchday: 2, kickoff: "2026-06-21T04:00:00Z", venue: "Estadio BBVA", city: "Monterrey" },
  { id: "F-5", groupId: "F", homeTeamId: "JPN", awayTeamId: "SWE", matchday: 3, kickoff: "2026-06-25T23:00:00Z", venue: "AT&T Stadium", city: "Dallas" },
  { id: "F-6", groupId: "F", homeTeamId: "TUN", awayTeamId: "NED", matchday: 3, kickoff: "2026-06-25T23:00:00Z", venue: "Arrowhead Stadium", city: "Kansas City" },

  // Group G: Belgium, Egypt, Iran, New Zealand
  { id: "G-1", groupId: "G", homeTeamId: "BEL", awayTeamId: "EGY", matchday: 1, kickoff: "2026-06-15T19:00:00Z", venue: "Lumen Field", city: "Seattle" },
  { id: "G-2", groupId: "G", homeTeamId: "IRN", awayTeamId: "NZL", matchday: 1, kickoff: "2026-06-16T01:00:00Z", venue: "SoFi Stadium", city: "Los Ángeles" },
  { id: "G-3", groupId: "G", homeTeamId: "BEL", awayTeamId: "IRN", matchday: 2, kickoff: "2026-06-21T19:00:00Z", venue: "SoFi Stadium", city: "Los Ángeles" },
  { id: "G-4", groupId: "G", homeTeamId: "NZL", awayTeamId: "EGY", matchday: 2, kickoff: "2026-06-22T01:00:00Z", venue: "BC Place", city: "Vancouver" },
  { id: "G-5", groupId: "G", homeTeamId: "EGY", awayTeamId: "IRN", matchday: 3, kickoff: "2026-06-27T03:00:00Z", venue: "Lumen Field", city: "Seattle" },
  { id: "G-6", groupId: "G", homeTeamId: "NZL", awayTeamId: "BEL", matchday: 3, kickoff: "2026-06-27T03:00:00Z", venue: "BC Place", city: "Vancouver" },

  // Group H: Spain, Cape Verde, Saudi Arabia, Uruguay
  { id: "H-1", groupId: "H", homeTeamId: "ESP", awayTeamId: "CPV", matchday: 1, kickoff: "2026-06-15T16:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { id: "H-2", groupId: "H", homeTeamId: "KSA", awayTeamId: "URU", matchday: 1, kickoff: "2026-06-15T22:00:00Z", venue: "Hard Rock Stadium", city: "Miami" },
  { id: "H-3", groupId: "H", homeTeamId: "ESP", awayTeamId: "KSA", matchday: 2, kickoff: "2026-06-21T16:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { id: "H-4", groupId: "H", homeTeamId: "URU", awayTeamId: "CPV", matchday: 2, kickoff: "2026-06-21T22:00:00Z", venue: "Hard Rock Stadium", city: "Miami" },
  { id: "H-5", groupId: "H", homeTeamId: "CPV", awayTeamId: "KSA", matchday: 3, kickoff: "2026-06-27T00:00:00Z", venue: "NRG Stadium", city: "Houston" },
  { id: "H-6", groupId: "H", homeTeamId: "URU", awayTeamId: "ESP", matchday: 3, kickoff: "2026-06-27T00:00:00Z", venue: "Estadio Akron", city: "Guadalajara" },

  // Group I: France, Senegal, Iraq, Norway
  { id: "I-1", groupId: "I", homeTeamId: "FRA", awayTeamId: "SEN", matchday: 1, kickoff: "2026-06-16T19:00:00Z", venue: "MetLife Stadium", city: "Nueva Jersey" },
  { id: "I-2", groupId: "I", homeTeamId: "IRQ", awayTeamId: "NOR", matchday: 1, kickoff: "2026-06-16T22:00:00Z", venue: "Gillette Stadium", city: "Boston" },
  { id: "I-3", groupId: "I", homeTeamId: "FRA", awayTeamId: "IRQ", matchday: 2, kickoff: "2026-06-22T21:00:00Z", venue: "Lincoln Financial Field", city: "Filadelfia" },
  { id: "I-4", groupId: "I", homeTeamId: "NOR", awayTeamId: "SEN", matchday: 2, kickoff: "2026-06-23T00:00:00Z", venue: "MetLife Stadium", city: "Nueva Jersey" },
  { id: "I-5", groupId: "I", homeTeamId: "NOR", awayTeamId: "FRA", matchday: 3, kickoff: "2026-06-26T19:00:00Z", venue: "Gillette Stadium", city: "Boston" },
  { id: "I-6", groupId: "I", homeTeamId: "SEN", awayTeamId: "IRQ", matchday: 3, kickoff: "2026-06-26T19:00:00Z", venue: "BMO Field", city: "Toronto" },

  // Group J: Argentina, Algeria, Austria, Jordan
  { id: "J-1", groupId: "J", homeTeamId: "ARG", awayTeamId: "ALG", matchday: 1, kickoff: "2026-06-17T01:00:00Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  { id: "J-2", groupId: "J", homeTeamId: "AUT", awayTeamId: "JOR", matchday: 1, kickoff: "2026-06-17T04:00:00Z", venue: "Levi's Stadium", city: "San Francisco" },
  { id: "J-3", groupId: "J", homeTeamId: "ARG", awayTeamId: "AUT", matchday: 2, kickoff: "2026-06-22T17:00:00Z", venue: "AT&T Stadium", city: "Dallas" },
  { id: "J-4", groupId: "J", homeTeamId: "JOR", awayTeamId: "ALG", matchday: 2, kickoff: "2026-06-23T03:00:00Z", venue: "Levi's Stadium", city: "San Francisco" },
  { id: "J-5", groupId: "J", homeTeamId: "ALG", awayTeamId: "AUT", matchday: 3, kickoff: "2026-06-28T02:00:00Z", venue: "Arrowhead Stadium", city: "Kansas City" },
  { id: "J-6", groupId: "J", homeTeamId: "JOR", awayTeamId: "ARG", matchday: 3, kickoff: "2026-06-28T02:00:00Z", venue: "AT&T Stadium", city: "Dallas" },

  // Group K: Portugal, DR Congo, Uzbekistan, Colombia
  { id: "K-1", groupId: "K", homeTeamId: "POR", awayTeamId: "COD", matchday: 1, kickoff: "2026-06-17T17:00:00Z", venue: "NRG Stadium", city: "Houston" },
  { id: "K-2", groupId: "K", homeTeamId: "UZB", awayTeamId: "COL", matchday: 1, kickoff: "2026-06-18T02:00:00Z", venue: "Estadio Azteca", city: "Ciudad de México" },
  { id: "K-3", groupId: "K", homeTeamId: "POR", awayTeamId: "UZB", matchday: 2, kickoff: "2026-06-23T17:00:00Z", venue: "NRG Stadium", city: "Houston" },
  { id: "K-4", groupId: "K", homeTeamId: "COL", awayTeamId: "COD", matchday: 2, kickoff: "2026-06-24T02:00:00Z", venue: "Estadio Akron", city: "Guadalajara" },
  { id: "K-5", groupId: "K", homeTeamId: "COL", awayTeamId: "POR", matchday: 3, kickoff: "2026-06-27T23:30:00Z", venue: "Hard Rock Stadium", city: "Miami" },
  { id: "K-6", groupId: "K", homeTeamId: "COD", awayTeamId: "UZB", matchday: 3, kickoff: "2026-06-27T23:30:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },

  // Group L: England, Croatia, Ghana, Panama
  { id: "L-1", groupId: "L", homeTeamId: "ENG", awayTeamId: "CRO", matchday: 1, kickoff: "2026-06-17T20:00:00Z", venue: "AT&T Stadium", city: "Dallas" },
  { id: "L-2", groupId: "L", homeTeamId: "GHA", awayTeamId: "PAN", matchday: 1, kickoff: "2026-06-17T23:00:00Z", venue: "BMO Field", city: "Toronto" },
  { id: "L-3", groupId: "L", homeTeamId: "ENG", awayTeamId: "GHA", matchday: 2, kickoff: "2026-06-23T20:00:00Z", venue: "Gillette Stadium", city: "Boston" },
  { id: "L-4", groupId: "L", homeTeamId: "PAN", awayTeamId: "CRO", matchday: 2, kickoff: "2026-06-23T23:00:00Z", venue: "BMO Field", city: "Toronto" },
  { id: "L-5", groupId: "L", homeTeamId: "PAN", awayTeamId: "ENG", matchday: 3, kickoff: "2026-06-27T21:00:00Z", venue: "MetLife Stadium", city: "Nueva Jersey" },
  { id: "L-6", groupId: "L", homeTeamId: "CRO", awayTeamId: "GHA", matchday: 3, kickoff: "2026-06-27T21:00:00Z", venue: "Lincoln Financial Field", city: "Filadelfia" },
];

export function getMatchesForGroup(groupId: string): Match[] {
  return matches.filter((m) => m.groupId === groupId.toUpperCase());
}

export function isMatchLocked(match: Match): boolean {
  return new Date(match.kickoff).getTime() <= Date.now();
}

const MATCH_DURATION_MS = 90 * 60 * 1000;

export function isMatchLive(match: Match): boolean {
  const now = Date.now();
  const kickoff = new Date(match.kickoff).getTime();
  return now >= kickoff && now <= kickoff + MATCH_DURATION_MS;
}

export function getLiveMatches(): Match[] {
  return matches.filter(isMatchLive);
}

export function getNextMatch(): Match | undefined {
  const now = Date.now();
  return matches
    .filter((m) => new Date(m.kickoff).getTime() > now)
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0];
}
