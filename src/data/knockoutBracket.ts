import { KnockoutRound } from "@/types";

export interface RoundInfo {
  id: KnockoutRound;
  label: string;
  shortLabel: string;
  matchCount: number;
}

export const knockoutRounds: RoundInfo[] = [
  { id: "R32", label: "Treintaidosavos", shortLabel: "R32", matchCount: 16 },
  { id: "R16", label: "Octavos de final", shortLabel: "R16", matchCount: 8 },
  { id: "QF", label: "Cuartos de final", shortLabel: "QF", matchCount: 4 },
  { id: "SF", label: "Semifinales", shortLabel: "SF", matchCount: 2 },
  { id: "3P", label: "Tercer puesto", shortLabel: "3ro", matchCount: 1 },
  { id: "F", label: "Final", shortLabel: "Final", matchCount: 1 },
];
