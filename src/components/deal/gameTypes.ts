export const AMOUNTS = [
  0.01, 1, 5, 10, 25, 50, 75, 100,
  200, 300, 400, 500, 750, 1_000,
  5_000, 10_000, 25_000, 50_000,
  75_000, 100_000, 200_000, 300_000,
  400_000, 500_000, 750_000, 1_000_000,
];

export const LOW_AMOUNTS = AMOUNTS.slice(0, 13);
export const HIGH_AMOUNTS = AMOUNTS.slice(13);

export const CASES_PER_ROUND = [6, 5, 4, 3, 2, 1, 1, 1, 1];

export type GamePhase = "pick" | "opening" | "offer" | "final" | "done";

export interface DealState {
  cases: number[];
  playerCase: number;
  opened: Set<number>;
  round: number;
  casesLeftThisRound: number;
  phase: GamePhase;
  offer: number;
  finalAmount: number;
  dealTaken: boolean;
}

export function formatMoney(amount: number): string {
  if (amount < 1) return "$0,01";
  if (amount >= 1_000_000) return "$1.000.000";
  return "$" + Math.floor(amount).toLocaleString("es-AR");
}

export const COMODIN_IMAGES = [
  "/images/comodin-fecha-1.jpg",
  "/images/comodin-fecha-2.jpg",
  "/images/comodin-fecha-3.jpg",
];

export const BANKER_PHRASES_OFFER = [
  ["Te ofrezco esto y no molesto más...", "Pensalo bien, pibe...", "¿Seguro que querés seguir?", "La AFA aprueba esta oferta"],
  ["¡INCREÍBLE la oferta señores!", "¡EL BANQUERO NO SE ANDA CON VUELTAS!", "¡MIRÁ ESE NÚMERO!", "¡QUÉ OFERTÓN!"],
  ["This is a tremendous offer!", "Take the deal, amigo!", "Nobody makes better deals than me!", "I'm being very generous here!"],
];

export const BANKER_PHRASES_NO_DEAL = [
  ["¡Te vas a arrepentir!", "Después no vengas a llorar...", "¡Qué atrevido!", "Le voy a decir a Conmebol..."],
  ["¡RECHAZÓ LA OFERTA señores!", "¡QUÉ CORAJE!", "¡ESTO SE PONE BUENO!", "¡TIENE SANGRE FRÍA!"],
  ["Bad decision! Very bad!", "You'll regret this!", "I'll be back with less!", "Nobody says no to me!"],
];

export const BANKER_PHRASES_DEAL = [
  ["Bien jugado, pibe", "Decisión inteligente", "Me sacaste plata...", "¡Te llevás una buena!"],
  ["¡DEAL señores, DEAL!", "¡SE LLEVÓ LA PLATA!", "¡QUÉ MOMENTO!", "¡CERRÓ EL TRATO!"],
  ["Smart move, very smart!", "You have a deal!", "Good negotiation!", "I respect that decision!"],
];
