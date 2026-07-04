export const CANVAS_W = 1;
export const CANVAS_H = 1.4;

export const COLS = 13;
export const ROWS = 13;
export const CELL_W = CANVAS_W / COLS;
export const CELL_H = CANVAS_H / ROWS;

export const PLAYER_START_ROW = ROWS - 1;
export const PLAYER_START_COL = Math.floor(COLS / 2);
export const GOAL_ROW = 0;

export const SAFE_ROWS = [0, 6, ROWS - 1];
export const WATER_ROWS = [1, 2, 3, 4, 5];

export const LIVES_INIT = 3;

export const COMODIN_CHANCE = 0.12;
export const COMODIN_SPEED_MULT = 1.5;

export const FLAG_CHANCE = 0.3;
export const FLAG_BONUS = 2;

export const TROPHY_BONUS = 3;
export const TROPHY_DURATION = 180;

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
  avatarIdx: number;
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

export interface WaterLane {
  row: number;
  direction: 1 | -1;
  speed: number;
  platforms: Platform[];
}

export interface Trophy {
  col: number;
  row: number;
  ticksLeft: number;
  collected: boolean;
}

export interface FrogusaState {
  playerCol: number;
  playerRow: number;
  lanes: Lane[];
  waterLanes: WaterLane[];
  playerX: number;
  flags: BonusFlag[];
  trophy: Trophy | null;
  score: number;
  goals: number;
  lives: number;
  level: number;
  status: "idle" | "playing" | "scored" | "hit" | "lost" | "won";
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

export const VENUE_TO_STADIUM: Record<string, string> = {
  "Arrowhead Stadium": "/images/stadiums/arrowhead-stadium.png",
  "AT&T Stadium": "/images/stadiums/att-stadium.png",
  "BC Place": "/images/stadiums/bc-place.png",
  "BMO Field": "/images/stadiums/bmo-field.png",
  "Estadio Akron": "/images/stadiums/estadio-akron.png",
  "Estadio Azteca": "/images/stadiums/estadio-azteca.png",
  "Estadio BBVA": "/images/stadiums/estadio-bbva.png",
  "Gillette Stadium": "/images/stadiums/gillette-stadium.png",
  "Hard Rock Stadium": "/images/stadiums/hard-rock-stadium.png",
  "Levi's Stadium": "/images/stadiums/levis-stadium.png",
  "Lincoln Financial Field": "/images/stadiums/lincoln-financial.png",
  "Lumen Field": "/images/stadiums/lumen-field.png",
  "Mercedes-Benz Stadium": "/images/stadiums/mercedes-benz-stadium.png",
  "MetLife Stadium": "/images/stadiums/metlife-stadium.png",
  "NRG Stadium": "/images/stadiums/nrg-stadium.png",
  "SoFi Stadium": "/images/stadiums/sofi-stadium.png",
};

export const ALL_STADIUM_IMAGES = Object.values(VENUE_TO_STADIUM);

export const COMODIN_IMAGES = [
  "/images/comodin-fecha-1.jpg",
  "/images/comodin-fecha-2.jpg",
  "/images/comodin-fecha-3.jpg",
  "/images/comodin-R32.jpg",
  "/images/comodin-R16.jpg",
];

export const COMODIN_HIT_PHRASES = [
  ["¡Quedate en tu área!", "¡Acá no se pasa!", "¡Tarjeta para vos!", "¡Volvé al banco!"],
  ["¡LO BAJARON señores!", "¡QUÉ ENTRADA!", "¡PLANCHAZO CRIMINAL!", "¡EXPULSIÓN directa!"],
  ["No crossing my lane!", "Tackled! Beautiful!", "Go back to your half!", "Red card for you!"],
  ["¡Yo no autoricé esta jugada!", "¡No debió haberse hecho!", "¡Guardo conmigo el dolor!", "¡Esto es culpa de Macri!"],
  ["¡Parto de nalga!", "¡Acá no pasa nadie!", "¡El resistir está grabado!", "¡Carreta delante del caballo!"],
];

export const COMODIN_DODGE_PHRASES = [
  ["¡¿Cómo pasó?!", "¡Se me escapó!", "¡Pedí refuerzos!", "¡Necesito VAR!"],
  ["¡SE LES FUE señores!", "¡NO LO PUDIERON PARAR!", "¡QUÉ VELOCIDAD!", "¡PASÓ COMO SI NADA!"],
  ["He's through! No way!", "Too fast for me!", "I need backup!", "Call the referee!"],
  ["¡Se me fue por zoom!", "¡Ni en Olivos lo paro!", "¡Me la pusieron!", "¡Algunos miserables se escapan!"],
  ["¡Cazador de utopías!", "¡Pasó remando en dulce de leche!", "¡Es más rápido que un átomo!", "¡No hay imposibles para ese!"],
];
