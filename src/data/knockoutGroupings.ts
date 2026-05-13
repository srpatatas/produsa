import { KnockoutRound } from "@/types";

export interface KnockoutMatchGroup {
  label: string;
  matchIds: string[];
  gradient: string;
}

// R32 grouped by which R16 match they feed into
// R16 grouped by which QF match they feed into
// QF grouped by which SF match they feed into

export const knockoutGroupings: Record<KnockoutRound, KnockoutMatchGroup[]> = {
  R32: [
    // R32-1 + R32-2 → R16-1
    { label: "Llave R16-1", matchIds: ["R32-1", "R32-2"], gradient: "from-fifa-green to-fifa-blue" },
    // R32-3 + R32-4 → R16-2
    { label: "Llave R16-2", matchIds: ["R32-3", "R32-4"], gradient: "from-amber-500 to-fifa-teal" },
    // R32-5 + R32-6 → R16-3
    { label: "Llave R16-3", matchIds: ["R32-5", "R32-6"], gradient: "from-fifa-purple to-fifa-green" },
    // R32-7 + R32-8 → R16-4
    { label: "Llave R16-4", matchIds: ["R32-7", "R32-8"], gradient: "from-fifa-red to-fifa-gold" },
    // R32-9 + R32-10 → R16-5
    { label: "Llave R16-5", matchIds: ["R32-9", "R32-10"], gradient: "from-fifa-teal to-fuchsia-600" },
    // R32-11 + R32-12 → R16-6
    { label: "Llave R16-6", matchIds: ["R32-11", "R32-12"], gradient: "from-fifa-blue to-fifa-red" },
    // R32-13 + R32-14 → R16-7
    { label: "Llave R16-7", matchIds: ["R32-13", "R32-14"], gradient: "from-fifa-red to-fifa-purple" },
    // R32-15 + R32-16 → R16-8
    { label: "Llave R16-8", matchIds: ["R32-15", "R32-16"], gradient: "from-fifa-green to-amber-600" },
  ],
  R16: [
    // R16-1 + R16-2 → QF-1
    { label: "Llave QF-1", matchIds: ["R16-1", "R16-2"], gradient: "from-fifa-green to-fifa-teal" },
    // R16-3 + R16-4 → QF-2
    { label: "Llave QF-2", matchIds: ["R16-3", "R16-4"], gradient: "from-fifa-purple to-fifa-gold" },
    // R16-5 + R16-6 → QF-3
    { label: "Llave QF-3", matchIds: ["R16-5", "R16-6"], gradient: "from-fifa-teal to-fifa-red" },
    // R16-7 + R16-8 → QF-4
    { label: "Llave QF-4", matchIds: ["R16-7", "R16-8"], gradient: "from-fifa-red to-amber-600" },
  ],
  QF: [
    // QF-1 + QF-2 → SF-1
    { label: "Llave SF-1", matchIds: ["QF-1", "QF-2"], gradient: "from-fifa-green to-fifa-purple" },
    // QF-3 + QF-4 → SF-2
    { label: "Llave SF-2", matchIds: ["QF-3", "QF-4"], gradient: "from-fifa-teal to-fifa-red" },
  ],
  SF: [
    { label: "Semifinales", matchIds: ["SF-1", "SF-2"], gradient: "from-fifa-purple to-fifa-teal" },
  ],
  "3P": [
    { label: "🏆 Final", matchIds: ["F"], gradient: "from-fifa-gold via-amber-500 to-fifa-gold" },
    { label: "Tercer puesto", matchIds: ["3P"], gradient: "from-fifa-dark-gray to-fifa-light-gray" },
  ],
  F: [],
};
