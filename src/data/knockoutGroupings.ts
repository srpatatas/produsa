import { KnockoutRound } from "@/types";

export interface KnockoutMatchGroup {
  label: string;
  matchIds: string[];
}

export const knockoutGroupings: Record<KnockoutRound, KnockoutMatchGroup[]> = {
  R32: [
    { label: "Grupos A y B", matchIds: ["R32-1", "R32-13"] },
    { label: "Grupos C y F", matchIds: ["R32-2", "R32-4"] },
    { label: "Grupos E e I", matchIds: ["R32-3", "R32-5"] },
    { label: "Grupos A e I", matchIds: ["R32-6", "R32-7"] },
    { label: "Grupos G y D", matchIds: ["R32-9", "R32-10", "R32-14"] },
    { label: "Grupos H y J", matchIds: ["R32-11", "R32-15"] },
    { label: "Grupos K y L", matchIds: ["R32-8", "R32-12", "R32-16"] },
  ],
  R16: [
    { label: "Llave 1", matchIds: ["R16-1", "R16-2"] },
    { label: "Llave 2", matchIds: ["R16-3", "R16-4"] },
    { label: "Llave 3", matchIds: ["R16-5", "R16-6"] },
    { label: "Llave 4", matchIds: ["R16-7", "R16-8"] },
  ],
  QF: [
    { label: "Llave A", matchIds: ["QF-1", "QF-2"] },
    { label: "Llave B", matchIds: ["QF-3", "QF-4"] },
  ],
  SF: [
    { label: "Semifinales", matchIds: ["SF-1", "SF-2"] },
  ],
  "3P": [
    { label: "Tercer puesto", matchIds: ["3P"] },
  ],
  F: [
    { label: "Final", matchIds: ["F"] },
  ],
};
