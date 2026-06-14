export const GRID_W = 80;
export const GRID_H = 60;
export const WIN_PCT = 90;
export const TICK_MS = 80;

export enum CellState {
  UNCLAIMED = 0,
  CLAIMED = 1,
  TRAIL = 2,
  BORDER = 3,
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

export const MAX_LIVES = 3;

export interface GameState {
  grid: CellState[][];
  player: Pos;
  trail: Pos[];
  isVenturing: boolean;
  enemy: Pos;
  enemyTick: number;
  revealedPct: number;
  lives: number;
  status: "playing" | "won" | "lost";
}

export const DELTA: Record<Direction, Pos> = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.RIGHT]: { x: 1, y: 0 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
};

export const BACKGROUND_IMAGES = [
  "/images/produsaPanic2.png",
];

export interface EnemyConfig {
  image: string;
  name: string;
  taunts: string[];
}

export const ENEMIES: EnemyConfig[] = [
  {
    image: "/images/comodin-fecha-1.jpg",
    name: "Chiqui Tapia",
    taunts: [
      "¡Yo arreglé fixtures peores que vos!",
      "¿Qué mirás, bobo? ¡Vení para acá!",
      "La AFA te manda saludos...",
      "Esto es como la Libertadores, no te escapás.",
      "¡Yo manejo todo, incluido este juego!",
      "Los puntos son como los dólares, ¡los quiero todos!",
      "¿Vas a correr como Higuaín?",
      "No hay VAR que te salve acá.",
    ],
  },
  {
    image: "/images/comodin-fecha-2.jpg",
    name: "Pollo Vignolo",
    taunts: [
      "¡¡¡TE VOY A AGARRAR, SEÑORES!!!",
      "¡ES IMPRESIONANTE CÓMO CORRÉS!",
      "¡¡¡NO TE ESCAPÁS, NO TE ESCAPÁS!!!",
      "¡QUÉ EMOCIÓN, QUÉ EMOCIÓN!",
      "¡VENÍ PARA ACÁ QUE ESTOY ON FIRE!",
      "¡¡¡GOOOL DE LA PERSECUCIÓN!!!",
      "¡¡Corré, corré, corré, corré!!",
      "¡Viví, sentí, perdé!",
    ],
  },
  {
    image: "/images/comodin-fecha-3.jpg",
    name: "Donald Trump",
    taunts: [
      "I'm going to catch you. It'll be HUGE.",
      "Nobody runs better than me. NOBODY.",
      "You're FIRED... from this game.",
      "I built a wall and you can't escape.",
      "This chase is TREMENDOUS.",
      "Many people say I'm the fastest. Many people.",
      "Make this game OVER again.",
      "SAD! You thought you could escape.",
    ],
  },
];
