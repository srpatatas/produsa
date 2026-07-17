export const COLS = 21;
export const ROWS = 21;
export const TICK_MS = 180;
export const MAX_OBSTACLES = 8;

export enum Direction {
  UP,
  RIGHT,
  DOWN,
  LEFT,
}

export interface Pos {
  x: number;
  y: number;
}

export interface SnakeState {
  snake: Pos[];
  dir: Direction;
  nextDir: Direction;
  food: Pos;
  foodType: "flag" | "trionda";
  obstacles: Pos[];
  score: number;
  length: number;
  moving: boolean;
  status: "playing" | "lost";
}

export const DELTA: Record<Direction, Pos> = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.RIGHT]: { x: 1, y: 0 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
};

export const OPPOSITE: Record<Direction, Direction> = {
  [Direction.UP]: Direction.DOWN,
  [Direction.DOWN]: Direction.UP,
  [Direction.LEFT]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.LEFT,
};

export const FLAG_CODES = [
  "mx", "za", "kr", "cz", "ca", "ba", "qa", "ch", "br", "ma",
  "ht", "us", "py", "au", "tr", "de", "cw", "ci", "ec", "nl",
  "jp", "se", "tn", "gb-eng", "cl", "ng", "ar", "pe", "pl", "dz",
  "fr", "sn", "iq", "no", "es", "hr", "pt", "uy", "ir", "ie",
  "co", "pa", "sa", "jm", "be", "il", "it", "ro",
];

export const ENEMY_IMAGES = [
  "/images/comodin-fecha-1.jpg",
  "/images/comodin-fecha-2.jpg",
  "/images/comodin-fecha-3.jpg",
  "/images/comodin-R32.jpg",
  "/images/comodin-R16.jpg",
  "/images/comodin-QF.jpg",
  "/images/comodin-SF.jpg",
  "/images/comodin-FINAL.jpg",
];
