import { KnockoutRound } from "@/types";

export interface KnockoutMatchGroup {
  label: string;
  matchIds: string[];
  gradient: string;
}

// Group accent colors (from GroupPairCard):
// A: green→teal, B: red→rose, C: blue→indigo, D: purple→fuchsia
// E: amber→gold, F: teal→cyan, G: red→purple, H: blue→green
// I: purple→blue, J: green→lime, K: gold→amber, L: red→blue

export const knockoutGroupings: Record<KnockoutRound, KnockoutMatchGroup[]> = {
  R32: [
    { label: "Grupos A y B", matchIds: ["R32-1", "R32-13"], gradient: "from-fifa-green via-fifa-teal to-fifa-red" },
    { label: "Grupos C y F", matchIds: ["R32-2", "R32-4"], gradient: "from-fifa-blue via-indigo-600 to-cyan-500" },
    { label: "Grupos E e I", matchIds: ["R32-3", "R32-5"], gradient: "from-amber-500 via-fifa-gold to-fifa-purple" },
    { label: "Grupos A e I", matchIds: ["R32-6", "R32-7"], gradient: "from-fifa-green via-fifa-teal to-fifa-blue" },
    { label: "Grupos G y D", matchIds: ["R32-9", "R32-10", "R32-14"], gradient: "from-fifa-red via-fifa-purple to-fuchsia-600" },
    { label: "Grupos H y J", matchIds: ["R32-11", "R32-15"], gradient: "from-fifa-blue via-fifa-green to-lime-500" },
    { label: "Grupos K y L", matchIds: ["R32-8", "R32-12", "R32-16"], gradient: "from-fifa-gold via-amber-600 to-fifa-blue" },
  ],
  R16: [
    { label: "Llave 1", matchIds: ["R16-1", "R16-2"], gradient: "from-fifa-green to-fifa-blue" },
    { label: "Llave 2", matchIds: ["R16-3", "R16-4"], gradient: "from-amber-500 to-fifa-teal" },
    { label: "Llave 3", matchIds: ["R16-5", "R16-6"], gradient: "from-fifa-red to-fifa-blue" },
    { label: "Llave 4", matchIds: ["R16-7", "R16-8"], gradient: "from-fifa-gold to-fifa-purple" },
  ],
  QF: [
    { label: "Llave A", matchIds: ["QF-1", "QF-2"], gradient: "from-fifa-green to-fifa-purple" },
    { label: "Llave B", matchIds: ["QF-3", "QF-4"], gradient: "from-fifa-red to-fifa-gold" },
  ],
  SF: [
    { label: "Semifinales", matchIds: ["SF-1", "SF-2"], gradient: "from-fifa-purple to-fifa-teal" },
  ],
  "3P": [
    { label: "Tercer puesto", matchIds: ["3P"], gradient: "from-fifa-gold to-amber-600" },
  ],
  F: [
    { label: "Final", matchIds: ["F"], gradient: "from-fifa-purple via-fifa-blue to-fifa-teal" },
  ],
};
