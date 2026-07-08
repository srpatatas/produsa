export const CANVAS_W = 400;
export const CANVAS_H = 600;
export const GRAVITY = 0.35;
export const BOUNCE_VY = -8.5;
export const SPRING_VY = -13;
export const MOVE_SPEED = 3.2;
export const ICE_FRICTION = 0.985;
export const ICE_ACCEL = 3.5;
export const BALL_R = 11;
export const MAX_VY = 12;
export const TOTAL_LEVELS = 8;

export type PlatformType = "normal" | "icy" | "crumble" | "spring";

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: PlatformType;
  crumbled: boolean;
  bounceAnim: number;
}

export interface Flag {
  x: number;
  y: number;
  code: string;
  collected: boolean;
}

export interface Spike {
  x: number;
  y: number;
  w: number;
  h: number;
  flipped: boolean;
}

export interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  dir: number;
  minX: number;
  maxX: number;
  comodinIndex: number;
}

export interface Gate {
  x: number;
  y: number;
  open: boolean;
  openAnim: number;  // 0 = hidden, 0→1 = opening animation, 1 = fully open
}

export const GATE_OPEN_SPEED = 0.03;

export interface TriompyState {
  ballX: number;
  ballY: number;
  vx: number;
  vy: number;
  iceVx: number;
  onGround: boolean;
  platforms: Platform[];
  flags: Flag[];
  spikes: Spike[];
  enemies: Enemy[];
  gate: Gate;
  score: number;
  lives: number;
  level: number;
  status: "playing" | "lost" | "cleared" | "dying" | "won";
  totalFlags: number;
  collectedFlags: number;
  deathTimer: number;
  enterAnim: number; // 0 = not entering, 0→1 = ball shrinking into hole
}

export const FLAG_CODES = [
  "ar", "br", "de", "fr", "es", "gb-eng", "it", "pt", "nl", "mx",
  "us", "jp", "kr", "ma", "hr", "uy", "co", "se", "au", "ca",
  "qa", "sa", "ir", "gh", "sn", "ch", "be", "ec", "dz", "at",
];

export const COMODIN_IMAGES = [
  "/images/comodin-fecha-1.jpg",
  "/images/comodin-fecha-2.jpg",
  "/images/comodin-fecha-3.jpg",
  "/images/comodin-R32.jpg",
  "/images/comodin-R16.jpg",
  "/images/comodin-QF.jpg",
];

export const PLATFORM_COLORS: Record<PlatformType, { top: string; body: string; shine: string }> = {
  normal: { top: "#4ade80", body: "#16a34a", shine: "#86efac" },
  icy: { top: "#67e8f9", body: "#0891b2", shine: "#cffafe" },
  crumble: { top: "#fbbf24", body: "#b45309", shine: "#fde68a" },
  spring: { top: "#f472b6", body: "#be185d", shine: "#fbcfe8" },
};

// 5×7 pixel bitmap digits (each row is a bitmask, 5 bits wide)
const DIGIT_BITMAPS: number[][] = [
  [0x0E, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0E], // 0
  [0x04, 0x0C, 0x04, 0x04, 0x04, 0x04, 0x0E], // 1
  [0x0E, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1F], // 2
  [0x0E, 0x11, 0x01, 0x06, 0x01, 0x11, 0x0E], // 3
  [0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02], // 4
  [0x1F, 0x10, 0x1E, 0x01, 0x01, 0x11, 0x0E], // 5
  [0x06, 0x08, 0x10, 0x1E, 0x11, 0x11, 0x0E], // 6
  [0x1F, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08], // 7
  [0x0E, 0x11, 0x11, 0x0E, 0x11, 0x11, 0x0E], // 8
  [0x0E, 0x11, 0x11, 0x0F, 0x01, 0x02, 0x0C], // 9
];

// Slash bitmap for "3/8" style counter
const SLASH_BITMAP = [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10];

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  pixelSize: number,
  color: string,
) {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of text) {
    let bitmap: number[] | null = null;
    if (ch >= "0" && ch <= "9") bitmap = DIGIT_BITMAPS[parseInt(ch)];
    else if (ch === "/") bitmap = SLASH_BITMAP;

    if (bitmap) {
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (bitmap[row] & (0x10 >> col)) {
            ctx.fillRect(cx + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
          }
        }
      }
      cx += 6 * pixelSize;
    } else {
      cx += 3 * pixelSize;
    }
  }
}

export const LEVEL_NAMES = [
  "Fase de Grupos",
  "Octavos",
  "Cuartos",
  "Semifinal",
  "La Final",
];
