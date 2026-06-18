export const CANVAS_W = 1;
export const CANVAS_H = 1.4;

export const COLS = 13;
export const ROWS = 13;
export const CELL_W = CANVAS_W / COLS;
export const CELL_H = CANVAS_H / ROWS;

export const PLAYER_START_ROW = ROWS - 1;
export const PLAYER_START_COL = Math.floor(COLS / 2);
export const GOAL_ROW = 0;

export const SAFE_ROWS = [0, 5, 6, ROWS - 1];
export const INVASION_ROWS = [1, 2, 3, 4];

export const LIVES_INIT = 3;

export const COMODIN_CHANCE = 0.12;
export const COMODIN_SPEED_MULT = 1.5;

export const FLAG_CHANCE = 0.3;
export const FLAG_BONUS = 2;

export interface Defender {
  x: number;
  row: number;
  width: number;
  flag: string;
  isComodin: boolean;
  comodinIdx: number;
}

export interface Lane {
  row: number;
  direction: 1 | -1;
  speed: number;
  defenders: Defender[];
}

export interface BonusFlag {
  col: number;
  row: number;
  code: string;
  collected: boolean;
}

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  time: number;
  color: string;
}

export interface Platform {
  x: number;
  width: number;
  row: number;
}

export interface InvasionLane {
  row: number;
  direction: 1 | -1;
  speed: number;
  platforms: Platform[];
}

export interface FrogusaState {
  playerCol: number;
  playerRow: number;
  lanes: Lane[];
  invasionLanes: InvasionLane[];
  playerX: number;
  flags: BonusFlag[];
  score: number;
  goals: number;
  lives: number;
  level: number;
  status: "idle" | "playing" | "scored" | "hit" | "lost";
  hitTime: number;
  scoreTime: number;
}

export const FLAG_CODES = [
  "mx", "za", "kr", "cz", "ca", "ba", "qa", "ch", "br", "ma",
  "ht", "us", "py", "au", "tr", "de", "cw", "ci", "ec", "nl",
  "jp", "se", "tn", "gb-eng", "ar", "fr", "sn", "iq", "no", "es",
  "hr", "pt", "uy", "ir", "co", "pa", "sa", "be", "dz", "at",
  "jo", "nz", "eg", "uz", "gh", "cv",
];

export const COMODIN_IMAGES = [
  "/images/comodin-fecha-1.jpg",
  "/images/comodin-fecha-2.jpg",
  "/images/comodin-fecha-3.jpg",
];

export const COMODIN_HIT_PHRASES = [
  ["¡Quedate en tu área!", "¡Acá no se pasa!", "¡Tarjeta para vos!", "¡Volvé al banco!"],
  ["¡LO BAJARON señores!", "¡QUÉ ENTRADA!", "¡PLANCHAZO CRIMINAL!", "¡EXPULSIÓN directa!"],
  ["No crossing my lane!", "Tackled! Beautiful!", "Go back to your half!", "Red card for you!"],
];

export const COMODIN_DODGE_PHRASES = [
  ["¡¿Cómo pasó?!", "¡Se me escapó!", "¡Pedí refuerzos!", "¡Necesito VAR!"],
  ["¡SE LES FUE señores!", "¡NO LO PUDIERON PARAR!", "¡QUÉ VELOCIDAD!", "¡PASÓ COMO SI NADA!"],
  ["He's through! No way!", "Too fast for me!", "I need backup!", "Call the referee!"],
];
