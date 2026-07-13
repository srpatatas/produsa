export const CANVAS_W = 1;
export const CANVAS_H = 1.4;

export const PLAYER_W = 0.06;
export const PLAYER_H = 0.035;
export const PLAYER_Y = CANVAS_H - 0.06;
export const PLAYER_SPEED = 0.008;

export const BULLET_W = 0.006;
export const BULLET_H = 0.02;
export const BULLET_SPEED = 0.012;
export const SHOOT_COOLDOWN_MS = 350;

export const INVADER_COLS = 8;
export const INVADER_ROWS = 4;
export const INVADER_W = 0.065;
export const INVADER_H = 0.04;
export const INVADER_GAP_X = 0.015;
export const INVADER_GAP_Y = 0.012;
export const INVADER_BASE_SPEED = 0.001;
export const INVADER_DROP = 0.03;
export const INVADER_SHOOT_CHANCE = 0.003;

export const BOSS_W = 0.14;
export const BOSS_H = 0.065;
export const BOSS_SPEED = 0.0015;
export const BOSS_HP = 5;
export const BOSS_SPAWN_CHANCE = 0.002;

export interface Pos {
  x: number;
  y: number;
}

export interface Invader {
  x: number;
  y: number;
  flag: string;
  alive: boolean;
}

export interface Boss {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  comodinIndex: number;
  dir: number;
}

export interface Bullet extends Pos {
  fromPlayer: boolean;
}

export interface InvadersState {
  player: number;
  bullets: Bullet[];
  invaders: Invader[];
  bosses: Boss[];
  bossMode: "random" | "mandatory";
  direction: 1 | -1;
  speed: number;
  score: number;
  lives: number;
  level: number;
  status: "playing" | "lost" | "cleared" | "won";
  lastShot: number;
  hitTime: number;
  bossHitTime: number;
  bossSpawned: boolean;
  levelStartTime: number;
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
  "/images/comodin-R32.jpg",
  "/images/comodin-R16.jpg",
  "/images/comodin-QF.jpg",
  "/images/comodin-SF.jpg",
];

export const COMODIN_HIT_LINES: string[][] = [
  ["¡Me están baleando!", "¡Esto no estaba en el reglamento!", "¡Voy a suspender el torneo!", "¡Le mando a Conmebol!", "¡¿QUIÉN ME PUSO ACÁ?!"],
  ["¡ESTÁN TIRANDO DESDE ABAJO!", "¡INCREÍBLE señores!", "¡Esto es una MASACRE!", "¡MAMITA QUERIDA!", "¡SE VIENE LA NOCHEEEE!"],
  ["Stop shooting, muy rude!", "My spaceship is the best!", "I'm calling Space Force!", "Nobody gets abducted like me!", "I'll make aliens pay for this!"],
  ["¡Yo no autoricé esta invasión!", "¡Me voy a Disney, chau!", "¡Guardo conmigo el dolor!", "¡El único responsable soy yo!", "¡Esto es peor que la fiesta de Olivos!"],
  ["¡Esto es un parto de nalga!", "¡Estamos remando en dulce de leche!", "¡El resistir está grabado en mi cédula!", "¡Éramos Bruce Willis y nos mataron!", "¡La carreta delante del caballo!"],
  ["¡La mano de Dios también baja naves!", "¡A mi cielo no sube nadie!", "¡Fuera de mi área, marcianos!", "¡Esto es más fácil que gambetear ingleses!", "¡El espacio también es potrero!"],
  ["¡Debí haber sido menos tibio con ese disparo!", "¡Las reformas espaciales van a llegar!", "¡Esto es gradualismo intergaláctico!", "¡Los gatos tenemos siete vidas! ¡Me quedan seis!", "¡Miau defensivo!"],
];
