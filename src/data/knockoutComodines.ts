import { KnockoutRound } from "@/types";

export interface KnockoutComodin {
  round: KnockoutRound;
  image: string | null;
  emoji: string;
  name: string;
}

export const knockoutComodines: Record<KnockoutRound, KnockoutComodin> = {
  R32: { round: "R32", image: null, emoji: "🦁", name: "León" },
  R16: { round: "R16", image: null, emoji: "🐯", name: "Tigre" },
  QF:  { round: "QF",  image: null, emoji: "🦅", name: "Águila" },
  SF:  { round: "SF",  image: null, emoji: "🐉", name: "Dragón" },
  "3P": { round: "3P", image: null, emoji: "🦊", name: "Zorro" },
  F:   { round: "F",   image: null, emoji: "👑", name: "Corona" },
};
