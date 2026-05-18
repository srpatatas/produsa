export const outcomeConfig: Record<string, { label: string; bg: string }> = {
  L: { label: "LOCAL", bg: "bg-outcome-local" },
  E: { label: "EMPATE", bg: "bg-outcome-empate" },
  V: { label: "VISITANTE", bg: "bg-outcome-visitante" },
  LE: { label: "LOCAL / EMPATE", bg: "bg-gradient-to-r from-outcome-local to-outcome-empate" },
  EL: { label: "LOCAL / EMPATE", bg: "bg-gradient-to-r from-outcome-local to-outcome-empate" },
  EV: { label: "EMPATE / VISITANTE", bg: "bg-gradient-to-r from-outcome-empate to-outcome-visitante" },
  VE: { label: "EMPATE / VISITANTE", bg: "bg-gradient-to-r from-outcome-empate to-outcome-visitante" },
  LV: { label: "LOCAL / VISITANTE", bg: "bg-gradient-to-r from-outcome-local to-outcome-visitante" },
  VL: { label: "LOCAL / VISITANTE", bg: "bg-gradient-to-r from-outcome-local to-outcome-visitante" },
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
