export const CANVAS_W = 1;
export const CANVAS_H = 1.4;

export const COLS = 9;
export const ROWS = 13;
export const CELL_W = CANVAS_W / COLS;
export const CELL_H = CANVAS_H / ROWS;

export const PLAYER_START_ROW = ROWS - 1;
export const PLAYER_START_COL = Math.floor(COLS / 2);
export const GOAL_ROW = 0;

export const SAFE_ROWS = [0, 6, ROWS - 1];

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

export interface FrogusaState {
  playerCol: number;
  playerRow: number;
  lanes: Lane[];
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
  ["¡Te marqué, pibe!", "¡De acá no pasás!", "¡Falta táctica!", "¡Jugá para mi equipo!"],
  ["¡LO BAJARON señores!", "¡QUÉ ENTRADA!", "¡PLANCHAZO CRIMINAL!", "¡NO LO DEJARON PASAR!"],
  ["Tackled! Tremendous!", "Nobody crosses my lane!", "You're out, amigo!", "I built a wall!"],
];
