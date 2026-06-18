export const CANVAS_W = 1;
export const CANVAS_H = 1.6;

export const BALL_X = 0.25;
export const BALL_RADIUS = 0.025;

export const GRAVITY = 0.0007;
export const FLAP_VEL = -0.012;
export const MAX_VEL = 0.014;

export const PIPE_W = 0.11;
export const PIPE_GAP_INIT = 0.30;
export const PIPE_GAP_MIN = 0.20;
export const PIPE_SPEED_INIT = 0.0045;
export const PIPE_SPACING = 0.50;

export const COMODIN_CHANCE = 0.18;
export const COMODIN_RADIUS = 0.022;
export const COMODIN_PENALTY = 3;
export const COMODIN_MIN_GAP = 0.24;

export const FLAG_CHANCE = 0.35;
export const FLAG_SIZE = 0.028;
export const FLAG_BONUS = 2;

export interface Pipe {
  x: number;
  gapY: number;
  gapSize: number;
  passed: boolean;
  comodin: number | null;
  comodinOffY: number;
  comodinHit: boolean;
}

export interface FloatingFlag {
  x: number;
  y: number;
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

export interface PelotusaState {
  ballY: number;
  ballVel: number;
  pipes: Pipe[];
  flags: FloatingFlag[];
  score: number;
  speed: number;
  gap: number;
  status: "idle" | "playing" | "lost";
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
  ["¡Te cobré offside!", "¡Acá manda la AFA!", "¡Sanción para vos!", "¡Tarjeta roja!"],
  ["¡INCREÍBLE señores, LO CHOCÓ!", "¡QUÉ GOLPE!", "¡MAMITA QUERIDA!", "¡SE FUE AL PASTO!"],
  ["You're fired from flying!", "Nobody blocks like me!", "I build the best walls!", "Sad! Very sad flying!"],
];

export const COMODIN_DODGE_PHRASES = [
  ["¡La próxima no te salvás!", "¡Suerte nomás!", "¡Ya te voy a agarrar!", "¡Eso fue offside eh!"],
  ["¡SE ESCAPÓ señores!", "¡INCREÍBLE la gambeta!", "¡NO LO PUDO AGARRAR!", "¡QUÉ CINTURA!"],
  ["You got lucky, very lucky!", "I'll get you next time!", "Nobody escapes me... well, you did", "Unfair! Rigged game!"],
];
