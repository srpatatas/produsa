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

export const VALID_OUTCOMES = Object.keys(outcomeConfig);

const CANONICAL_ORDER = "LEV";

export function normalizeOutcome(outcome: string): string {
  if (outcome.length !== 2) return outcome;
  const sorted = [...outcome].sort((a, b) => CANONICAL_ORDER.indexOf(a) - CANONICAL_ORDER.indexOf(b)).join("");
  return sorted;
}

export function getOutcomeLabel(outcome: string): string {
  return outcomeConfig[normalizeOutcome(outcome)]?.label ?? outcomeConfig[outcome]?.label ?? outcome;
}

export function getOutcomeBg(outcome: string): string {
  return outcomeConfig[normalizeOutcome(outcome)]?.bg ?? outcomeConfig[outcome]?.bg ?? "bg-surface";
}

export function getOutcome(home: number, away: number): "L" | "E" | "V" {
  if (home > away) return "L";
  if (home < away) return "V";
  return "E";
}

export const getLiveOutcome = getOutcome;
