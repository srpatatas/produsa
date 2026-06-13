export const COLS = 21;
export const ROWS = 21;
export const TICK_MS = 250;
export const POWER_DURATION = 40;
export const MAX_LIVES = 3;

export enum CellType {
  WALL = 0,
  DOT = 1,
  EMPTY = 2,
  POWER = 3,
}

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

export interface Ghost {
  pos: Pos;
  dir: Direction;
  scared: boolean;
  eaten: boolean;
  imageIdx: number;
}

export interface ProdmanState {
  grid: CellType[][];
  player: Pos;
  playerDir: Direction;
  nextDir: Direction | null;
  ghosts: Ghost[];
  score: number;
  lives: number;
  dotsLeft: number;
  powerTimer: number;
  moving: boolean;
  status: "playing" | "won" | "lost";
  tick: number;
}

export const DELTA: Record<Direction, Pos> = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.RIGHT]: { x: 1, y: 0 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
};

export const ENEMY_IMAGES = [
  "/images/comodin-fecha-1.jpg",
  "/images/comodin-fecha-2.jpg",
  "/images/comodin-fecha-3.jpg",
];

// # = wall, . = dot, O = power pellet, _ = empty, P = player, G = ghost house
const MAZE_TEMPLATE = [
  "#####################",
  "#O........#........O#",
  "#.###.###.#.###.###.#",
  "#...................#",
  "#.##.##.#####.##.##.#",
  "#.....#...#...#.....#",
  "#.###.#.#.#.#.#.###.#",
  "#.....#.#...#.#.....#",
  "###.###.#####.###.###",
  "   ................. ",
  "###.##.## # ##.##.###",
  "   .##.# GGG #.##.   ",
  "###.##.# GGG #.##.###",
  "   .##.#######.##.   ",
  "###.##.........##.###",
  "#...................#",
  "#.###.###.#.###.###.#",
  "#.....#...#...#.....#",
  "#.##.##.#####.##.##.#",
  "#O........P........O#",
  "#####################",
];

export function parseMaze(): {
  grid: CellType[][];
  playerStart: Pos;
  ghostStarts: Pos[];
  totalDots: number;
} {
  const grid: CellType[][] = [];
  let playerStart: Pos = { x: 10, y: 16 };
  const ghostStarts: Pos[] = [];
  let totalDots = 0;

  for (let y = 0; y < ROWS; y++) {
    const row: CellType[] = [];
    const line = MAZE_TEMPLATE[y] || "";
    for (let x = 0; x < COLS; x++) {
      const ch = line[x] || " ";
      switch (ch) {
        case "#":
          row.push(CellType.WALL);
          break;
        case ".":
          row.push(CellType.DOT);
          totalDots++;
          break;
        case "O":
          row.push(CellType.POWER);
          totalDots++;
          break;
        case "P":
          row.push(CellType.DOT);
          totalDots++;
          playerStart = { x, y };
          break;
        case "G":
          row.push(CellType.EMPTY);
          ghostStarts.push({ x, y });
          break;
        default:
          row.push(CellType.EMPTY);
          break;
      }
    }
    grid.push(row);
  }

  return { grid, playerStart, ghostStarts, totalDots };
}
