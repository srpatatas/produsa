export const CANVAS_W = 1;
export const CANVAS_H = 1.6;

export const BALL_X = 0.25;
export const BALL_RADIUS = 0.025;

export const GRAVITY = 0.0007;
export const FLAP_VEL = -0.012;
export const MAX_VEL = 0.014;

export const PIPE_W = 0.11;
export const PIPE_GAP_INIT = 0.30;
export const PIPE_GAP_MIN = 0.18;
export const PIPE_SPEED_INIT = 0.0045;
export const PIPE_SPACING = 0.50;

export const COMODIN_CHANCE = 0.18;
export const COMODIN_RADIUS = 0.032;
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
  big?: boolean;
}

export interface PelotusaState {
  ballY: number;
  ballVel: number;
  pipes: Pipe[];
  flags: FloatingFlag[];
  score: number;
  goals: number;
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
  "/images/comodin-R32.jpg",
  "/images/comodin-R16.jpg",
  "/images/comodin-QF.jpg",
  "/images/comodin-SF.jpg",
];

export const COMODIN_HIT_PHRASES = [
  ["¡Te paré, Diego!", "¡Acá manda la AFA!", "¡Ni el D10S me pasa!", "¡Offside, Diego, offside!"],
  ["¡LO FRENÉ señores!", "¡QUÉ PLANCHAZO le di!", "¡NO VA MÁS, Diego!", "¡NI MARADONA me gambetea!"],
  ["I stopped Diego! Tremendous!", "Not even D10S gets past me!", "Diego, you're fired!", "I built a wall and it worked!"],
  ["¡Yo no autoricé esta jugada!", "¡Guardo conmigo el dolor!", "¡Ni Maradona pasa por Olivos!", "¡La culpa es de Macri!"],
  ["¡Esto es un parto de nalga!", "¡El resistir está grabado!", "¡Ni Bruce Willis me pasa!", "¡Carreta delante del caballo!"],
  ["¡Me atajé a mí mismo, no lo puedo creer!", "¡El único que para a Diego es Diego!", "¡A Dios no lo gambetea ni Dios!", "¡Perdoname pibe, pero el área es mía!"],
  ["¡El gato paró al Diego!", "¡Reforma exitosa por primera vez!", "¡No fui tibio esta vez!", "¡En Boca parábamos a jugadores mejores!"],
];

export const COMODIN_DODGE_PHRASES = [
  ["¡¿Cómo se me escapó?!", "¡Ni con el VAR lo paro!", "¡Es imposible marcarlo!", "¡Ese pibe es un fenómeno!"],
  ["¡SE ME FUE EL DIEGO!", "¡QUÉ GAMBETA señores!", "¡IMPOSIBLE frenarlo!", "¡Es de otro planeta!"],
  ["He got past me! Unfair!", "I need a bigger wall!", "Nobody dribbles like that!", "The D10S is too good!"],
  ["¡Se me fue! ¡Yo soy ajeno a esto!", "¡Ni con zoom lo paro!", "¡Es peor que la fiesta de Olivos!", "¡Maradona fue de Argentinos, qué esperabas!"],
  ["¡Es un cazador de utopías!", "¡Remando en dulce de leche!", "¡Me gambeteó como Einstein al átomo!", "¡No hay imposibles para ese pibe!"],
  ["¡Ese soy yo, nadie me para!", "¡Gambeta sagrada, ni yo me la creo!", "¡Se fue como en el 86, de memoria!", "¡Barrilete cósmico, obvio: el planeta es mío!"],
  ["¡Me gambeteó como la inflación!", "¡Fui muy gradualista para esa gambeta!", "¡Se fue! ¡Como mis votos en el 2019!", "¡Necesito un refuerzo de invierno urgente!"],
];
