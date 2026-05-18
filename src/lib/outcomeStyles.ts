export const outcomeConfig: Record<string, { label: string; bg: string }> = {
  L: { label: "LOCAL", bg: "bg-fifa-green" },
  E: { label: "EMPATE", bg: "bg-fifa-blue" },
  V: { label: "VISITANTE", bg: "bg-fifa-red" },
  LE: { label: "LOCAL / EMPATE", bg: "bg-gradient-to-r from-fifa-green to-fifa-blue" },
  EL: { label: "LOCAL / EMPATE", bg: "bg-gradient-to-r from-fifa-green to-fifa-blue" },
  EV: { label: "EMPATE / VISITANTE", bg: "bg-gradient-to-r from-fifa-blue to-fifa-red" },
  VE: { label: "EMPATE / VISITANTE", bg: "bg-gradient-to-r from-fifa-blue to-fifa-red" },
  LV: { label: "LOCAL / VISITANTE", bg: "bg-gradient-to-r from-fifa-green to-fifa-red" },
  VL: { label: "LOCAL / VISITANTE", bg: "bg-gradient-to-r from-fifa-green to-fifa-red" },
};

export function getOutcomeLabel(outcome: string): string {
  return outcomeConfig[outcome]?.label ?? outcome;
}

export function getOutcomeBg(outcome: string): string {
  return outcomeConfig[outcome]?.bg ?? "bg-surface";
}

export function getLiveOutcome(home: number, away: number): "L" | "E" | "V" {
  if (home > away) return "L";
  if (home < away) return "V";
  return "E";
}
