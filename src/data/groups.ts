import { Group } from "@/types";

export const groups: Group[] = [
  { id: "A", teams: ["MEX", "RSA", "KOR", "CZE"] },
  { id: "B", teams: ["CAN", "BIH", "QAT", "SUI"] },
  { id: "C", teams: ["BRA", "MAR", "HAI", "SCO"] },
  { id: "D", teams: ["USA", "PAR", "AUS", "TUR"] },
  { id: "E", teams: ["GER", "CUW", "CIV", "ECU"] },
  { id: "F", teams: ["NED", "JPN", "SWE", "TUN"] },
  { id: "G", teams: ["BEL", "EGY", "IRN", "NZL"] },
  { id: "H", teams: ["ESP", "CPV", "KSA", "URU"] },
  { id: "I", teams: ["FRA", "SEN", "IRQ", "NOR"] },
  { id: "J", teams: ["ARG", "ALG", "AUT", "JOR"] },
  { id: "K", teams: ["POR", "COD", "UZB", "COL"] },
  { id: "L", teams: ["ENG", "CRO", "GHA", "PAN"] },
];

export function getGroup(id: string): Group | undefined {
  return groups.find((g) => g.id === id.toUpperCase());
}
