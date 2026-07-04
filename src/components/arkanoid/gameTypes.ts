export const CANVAS_W = 1;
export const CANVAS_H = 1.5;
export const PADDLE_W = 0.15;
export const PADDLE_H = 0.025;
export const BALL_R = 0.015;
export const BALL_SPEED = 0.008;
export const BRICK_ROWS = 4;
export const BRICK_COLS = 7;
export const BRICK_H = 0.04;
export const BRICK_GAP = 0.006;
export const BRICK_TOP = 0.08;

export interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  flag: string;
  color: string;
  isComodin: boolean;
  comodinIndex: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PowerUp {
  x: number;
  y: number;
  vy: number;
  type: "boot" | "var" | "red";
}

export interface SpeechBubble {
  x: number;
  y: number;
  text: string;
  time: number;
}

export interface ArkanoidState {
  paddle: number;
  ball: Ball;
  bricks: Brick[];
  powerUps: PowerUp[];
  bubbles: SpeechBubble[];
  score: number;
  lives: number;
  level: number;
  status: "playing" | "lost" | "cleared" | "respawning";
  paddleW: number;
  slowUntil: number;
  respawnTime: number;
}

export const GROUP_HEADS = new Set([
  "mx", "ca", "br", "us", "de", "nl", "be", "es", "fr", "ar", "pt", "gb-eng",
]);

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
  "/images/comodin-R32.jpg",
  "/images/comodin-R16.jpg",
];

export const COMODIN_HIT_LINES: string[][] = [
  ["¡Eh pará!", "¡Llamo a la FIFA!", "¡Esto es un escándalo!"],
  ["¡NO NO NO!", "¡ATENCIÓN!", "¡INIMAGINAAAAABLE!"],
  ["Not good, muy bad!", "Tremendously unfair!", "I'll build a bigger wall!"],
  ["¡Yo soy ajeno a esto!", "¡La culpa es de Cristina!", "¡Me voy a Disney!"],
  ["¡Parto de nalga!", "¡Remando en dulce de leche!", "¡Somos Bruce Willis!"],
];

export const POWERUP_LABELS: Record<string, string> = {
  boot: "🥾",
  var: "📺",
  red: "🟥",
};

export const BRICK_COLORS = [
  "#6366f1", "#3b82f6", "#14b8a6", "#22c55e", "#f59e0b", "#ef4444", "#f97316", "#8b5cf6",
];
