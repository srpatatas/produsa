export const COLS = 10;
export const ROWS = 20;
export const TICK_MS = 600;
export const GARBAGE_ROWS = 3;

export interface CellData {
  color: string;
  flag: string;
}

export type Cell = CellData | null;
export type Board = Cell[][];

export interface Pos {
  x: number;
  y: number;
}

export interface Piece {
  shape: number[][];
  color: string;
  flag: string;
  pos: Pos;
  isTrionda: boolean;
}

export interface TetrisState {
  board: Board;
  current: Piece;
  next: Piece;
  score: number;
  lines: number;
  level: number;
  status: "playing" | "lost";
  lastClear: number;
  lastClearTime: number;
}

export const COLORS = [
  "#6366f1", // I
  "#f59e0b", // O
  "#14b8a6", // T
  "#22c55e", // S
  "#ef4444", // Z
  "#3b82f6", // J
  "#f97316", // L
];

export const SHAPES: number[][][] = [
  [[1, 1, 1, 1]],                     // I
  [[1, 1], [1, 1]],                    // O
  [[0, 1, 0], [1, 1, 1]],             // T
  [[0, 1, 1], [1, 1, 0]],             // S
  [[1, 1, 0], [0, 1, 1]],             // Z
  [[1, 0, 0], [1, 1, 1]],             // J
  [[0, 0, 1], [1, 1, 1]],             // L
];

export const TRIONDA_SHAPE: number[][] = [[1]];
export const TRIONDA_COLOR = "#c5e34a";
export const TRIONDA_BONUS = 300;

export const POINTS_PER_LINES: Record<number, number> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

export const FLAG_CODES = [
  "mx", "za", "kr", "cz", "ca", "ba", "qa", "ch", "br", "ma",
  "ht", "us", "py", "au", "tr", "de", "cw", "ci", "ec", "nl",
  "jp", "se", "tn", "gb-eng", "ar", "fr", "sn", "iq", "no", "es",
  "hr", "pt", "uy", "ir", "co", "pa", "sa", "be", "dz", "at",
  "jo", "nz", "eg", "uz", "gh", "cv",
];

export const CLEAR_LABELS: Record<number, string> = {
  1: "GOL",
  2: "DOBLE",
  3: "HAT TRICK",
  4: "GOLAZO",
};
