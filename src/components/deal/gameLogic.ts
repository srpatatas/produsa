import { AMOUNTS, CASE_FLAGS, CASES_PER_ROUND, type DealState } from "./gameTypes";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createInitialState(): DealState {
  return {
    cases: shuffle(AMOUNTS),
    caseFlags: shuffle(CASE_FLAGS),
    playerCase: -1,
    opened: new Set(),
    round: 0,
    casesLeftThisRound: 0,
    phase: "pick",
    offer: 0,
    finalAmount: 0,
    dealTaken: false,
    started: false,
  };
}

export function pickCase(state: DealState, idx: number): DealState {
  if (state.phase !== "pick" || state.playerCase !== -1) return state;
  return {
    ...state,
    playerCase: idx,
    phase: "opening",
    casesLeftThisRound: CASES_PER_ROUND[0],
  };
}

export function openCase(state: DealState, idx: number): DealState {
  if (state.phase !== "opening") return state;
  if (idx === state.playerCase || state.opened.has(idx)) return state;

  const newOpened = new Set(state.opened);
  newOpened.add(idx);
  const remaining = state.casesLeftThisRound - 1;

  if (remaining <= 0) {
    const offer = calculateOffer(state.cases, newOpened, state.playerCase, state.round);

    // Check if only 1 case left (besides player's)
    const unopened = state.cases.filter((_, i) => i !== state.playerCase && !newOpened.has(i));
    if (unopened.length === 0) {
      return {
        ...state,
        opened: newOpened,
        casesLeftThisRound: 0,
        phase: "final",
        offer,
        finalAmount: state.cases[state.playerCase],
      };
    }

    return {
      ...state,
      opened: newOpened,
      casesLeftThisRound: 0,
      phase: "offer",
      offer,
    };
  }

  return {
    ...state,
    opened: newOpened,
    casesLeftThisRound: remaining,
  };
}

export function acceptDeal(state: DealState): DealState {
  return {
    ...state,
    phase: "done",
    dealTaken: true,
    finalAmount: state.offer,
  };
}

export function rejectDeal(state: DealState): DealState {
  const nextRound = state.round + 1;
  const casesPerRound = CASES_PER_ROUND[Math.min(nextRound, CASES_PER_ROUND.length - 1)];

  // Check if only 1 unopened case remains (besides player's)
  const unopened = state.cases.filter((_, i) => i !== state.playerCase && !state.opened.has(i));
  if (unopened.length <= 1) {
    return {
      ...state,
      phase: "final",
      round: nextRound,
      finalAmount: state.cases[state.playerCase],
    };
  }

  return {
    ...state,
    phase: "opening",
    round: nextRound,
    casesLeftThisRound: Math.min(casesPerRound, unopened.length),
  };
}

export function revealFinal(state: DealState): DealState {
  return {
    ...state,
    phase: "done",
    dealTaken: false,
    finalAmount: state.cases[state.playerCase],
  };
}

// Based on empirical analysis of the US show:
// Offer starts at ~15% of EV and climbs to ~100%+ in final rounds
// Source: commcognition.blogspot.com/2007/06/deal-or-no-deal-bankers-formula.html
const OFFER_PCT = [0.15, 0.24, 0.34, 0.45, 0.58, 0.72, 0.85, 0.95, 1.0];

function calculateOffer(
  cases: number[],
  opened: Set<number>,
  playerCase: number,
  round: number,
): number {
  const remaining = cases.filter((_, i) => !opened.has(i) && i !== playerCase);
  if (remaining.length === 0) return 0;

  const ev = remaining.reduce((s, v) => s + v, 0) / remaining.length;
  const maxVal = Math.max(...remaining);
  const casesLeft = remaining.length;

  // Base percentage from round
  const basePct = OFFER_PCT[Math.min(round, OFFER_PCT.length - 1)];

  // Penalize if big values are still in play (banker is scared)
  // Bonus if big values are gone (banker is confident)
  const bigValuesLeft = remaining.filter((v) => v >= 100_000).length;
  const bigValueRatio = bigValuesLeft / Math.max(1, casesLeft);
  const volatilityAdj = bigValueRatio > 0.3 ? -0.05 : bigValueRatio === 0 ? 0.08 : 0;

  // Slight random variation (±5%) for drama
  const noise = (Math.random() - 0.5) * 0.1;

  const finalPct = Math.max(0.1, Math.min(1.05, basePct + volatilityAdj + noise));
  const offer = Math.round(ev * finalPct);

  return Math.max(1, offer);
}
