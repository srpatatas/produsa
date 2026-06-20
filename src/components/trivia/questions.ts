export interface Question {
  q: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  hint: string;
}

// Difficulty tiers: 1-5 easy, 6-10 medium, 11-15 hard
const EASY: Question[] = [
  { q: "¿Cuántas estrellas tiene Argentina en su camiseta?", options: ["1", "2", "3", "4"], answer: 2, hint: "Ganó en el '78, '86 y 2022" },
  { q: "¿En qué país se jugó el primer Mundial?", options: ["Brasil", "Italia", "Uruguay", "Francia"], answer: 2, hint: "Fue en 1930, en Sudamérica" },
  { q: "¿Qué selección ganó el Mundial 2022 en Qatar?", options: ["Francia", "Argentina", "Brasil", "Croacia"], answer: 1, hint: "Messi levantó la copa" },
  { q: "¿Cuántos jugadores tiene un equipo en la cancha?", options: ["10", "11", "12", "9"], answer: 1, hint: "Diez de campo más el arquero" },
  { q: "¿De qué color es la camiseta titular de Brasil?", options: ["Azul", "Verde", "Amarilla", "Blanca"], answer: 2, hint: "El color de la canarinha" },
  { q: "¿Qué selección es conocida como 'La Roja'?", options: ["Portugal", "Chile", "España", "Las dos últimas"], answer: 3, hint: "Ambas usan rojo y comparten el apodo" },
  { q: "¿Cuántos minutos dura un partido de fútbol reglamentario?", options: ["80", "90", "100", "120"], answer: 1, hint: "Dos tiempos de 45" },
  { q: "¿Qué país organizó el Mundial 2014?", options: ["Sudáfrica", "Rusia", "Brasil", "Alemania"], answer: 2, hint: "El famoso 7-1 fue como local" },
  { q: "¿Cuál es el trofeo que se entrega al campeón del mundo?", options: ["Copa Jules Rimet", "Copa FIFA", "Balón de Oro", "Copa del Mundo FIFA"], answer: 3, hint: "Se usa desde 1974" },
  { q: "¿En qué continente se juega el Mundial 2026?", options: ["Europa", "Asia", "América", "África"], answer: 2, hint: "Tres países co-organizadores" },
];

const MEDIUM: Question[] = [
  { q: "¿Quién es el máximo goleador en la historia de los Mundiales?", options: ["Pelé", "Ronaldo", "Miroslav Klose", "Gerd Müller"], answer: 2, hint: "Alemán, 16 goles en 4 Mundiales" },
  { q: "¿En qué Mundial Maradona hizo el 'Gol del Siglo'?", options: ["España 1982", "México 1986", "Italia 1990", "USA 1994"], answer: 1, hint: "El mismo partido de la Mano de Dios" },
  { q: "¿Qué selección perdió tres finales de Mundial consecutivas (2010-2018)?", options: ["Alemania", "Brasil", "Países Bajos", "Argentina"], answer: 3, hint: "Perdió en 2014 y ganó en 2022" },
  { q: "¿Cuántos Mundiales ganó Italia?", options: ["2", "3", "4", "5"], answer: 2, hint: "'34, '38, '82 y 2006" },
  { q: "¿Qué país fue el primer anfitrión africano de un Mundial?", options: ["Nigeria", "Sudáfrica", "Marruecos", "Egipto"], answer: 1, hint: "Fue en 2010, con las vuvuzelas" },
  { q: "¿Quién metió el gol de la final del Mundial 2014?", options: ["Messi", "Müller", "Götze", "Kroos"], answer: 2, hint: "Un gol en el alargue, de volea con el pecho" },
  { q: "¿Qué jugador ganó el Balón de Oro del Mundial 2022?", options: ["Mbappé", "Messi", "Modric", "Martínez"], answer: 1, hint: "Ganó el torneo y el premio individual" },
  { q: "¿Cuántos países participan en el Mundial 2026?", options: ["32", "36", "48", "64"], answer: 2, hint: "Se expandió por primera vez desde 1998" },
  { q: "¿Qué selección fue eliminada en fase de grupos en 2014 siendo campeona vigente?", options: ["Italia", "Francia", "España", "Alemania"], answer: 2, hint: "Había ganado en Sudáfrica 2010" },
  { q: "¿En qué estadio se jugará la final del Mundial 2026?", options: ["SoFi Stadium", "MetLife Stadium", "Estadio Azteca", "AT&T Stadium"], answer: 1, hint: "Está en Nueva Jersey, cerca de Nueva York" },
];

const HARD: Question[] = [
  { q: "¿Quién es el jugador más joven en marcar en una final de Mundial?", options: ["Pelé", "Mbappé", "Michael Owen", "Ronaldo"], answer: 0, hint: "Tenía 17 años en la final de 1958" },
  { q: "¿Cuál fue el primer Mundial que se definió por penales en la final?", options: ["Italia 1990", "USA 1994", "Alemania 2006", "Brasil 2014"], answer: 1, hint: "Brasil vs Italia, Baggio erró el último penal" },
  { q: "¿Qué selección tiene más partidos jugados en la historia de los Mundiales?", options: ["Brasil", "Alemania", "Argentina", "Italia"], answer: 1, hint: "Participó en todas las ediciones excepto una" },
  { q: "¿Quién es el arquero con más partidos en Mundiales?", options: ["Buffon", "Neuer", "Sepp Maier", "Manuel Neuer"], answer: 1, hint: "Alemán, 4 Mundiales (2006-2022)" },
  { q: "¿En qué año se usó por primera vez el VAR en un Mundial?", options: ["2014", "2018", "2022", "2010"], answer: 1, hint: "Fue en Rusia" },
  { q: "¿Qué jugador marcó el gol más rápido en la historia de los Mundiales?", options: ["Hakan Şükür", "Davide Gualtieri", "Clint Dempsey", "Neymar"], answer: 0, hint: "A los 11 segundos, en el partido por el tercer puesto de 2002" },
  { q: "¿Cuántos goles se marcaron en la final Argentina-Francia del Mundial 2022?", options: ["5", "6", "7", "8"], answer: 1, hint: "3-3 en tiempo reglamentario y extra, definido por penales" },
  { q: "¿Qué selección es la única en haber jugado todos los Mundiales?", options: ["Argentina", "Alemania", "Italia", "Brasil"], answer: 3, hint: "La pentacampeona nunca faltó" },
  { q: "¿Quién dirigió a Argentina en los Mundiales 1978 y 1982?", options: ["Bilardo", "Menotti", "Sabella", "Basile"], answer: 1, hint: "El Flaco, campeón en el '78" },
  { q: "¿Cuál es la mayor goleada en la historia de los Mundiales?", options: ["Alemania 7-1 Brasil", "Hungría 10-1 El Salvador", "Australia 31-0 Samoa", "Hungría 9-0 Corea del Sur"], answer: 1, hint: "Fue en España 1982" },
];

export function getQuestions(): Question[] {
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  return [
    ...shuffle(EASY).slice(0, 5),
    ...shuffle(MEDIUM).slice(0, 5),
    ...shuffle(HARD).slice(0, 5),
  ];
}

export const PRIZE_LADDER = [
  "Alcanzapelotas",
  "Hincha",
  "Suplente",
  "Titular",
  "Capitán",
  "Goleador",
  "Figura",
  "Crack",
  "Estrella",
  "Ídolo",
  "Leyenda",
  "Balón de Oro",
  "Campeón",
  "Bicampeón",
  "D10S del Mundial",
];

export const SAFETY_NETS = [4, 9];
