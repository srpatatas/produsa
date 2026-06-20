export interface Question {
  q: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  hint: string;
}

// EASY: any WC fan should know these
const EASY: Question[] = [
  { q: "¿Qué selección ganó el primer Mundial de la historia en 1930?", options: ["Argentina", "Brasil", "Uruguay", "Italia"], answer: 2, hint: "Fue el país anfitrión" },
  { q: "¿Quién hizo la 'Mano de Dios' en México 1986?", options: ["Valdano", "Maradona", "Burruchaga", "Batista"], answer: 1, hint: "El mismo que hizo el Gol del Siglo" },
  { q: "¿Qué selección ganó el Mundial 2006 en Alemania?", options: ["Francia", "Alemania", "Italia", "Brasil"], answer: 2, hint: "Zidane dio el cabezazo en la final" },
  { q: "¿Cuántos Mundiales ganó Brasil hasta 2022?", options: ["4", "5", "6", "3"], answer: 1, hint: "Es la selección más ganadora de la historia" },
  { q: "¿En qué ciudad se jugó la final del Mundial 2022?", options: ["Doha", "Lusail", "Al Khor", "Abu Dabi"], answer: 1, hint: "El estadio más grande de Qatar" },
  { q: "¿Qué jugador francés hizo un hat-trick en la final del Mundial 2022?", options: ["Griezmann", "Dembélé", "Mbappé", "Giroud"], answer: 2, hint: "Metió 2 en 97 segundos" },
  { q: "¿Qué selección eliminó a Brasil en el 'Maracanazo' de 1950?", options: ["Argentina", "Uruguay", "Paraguay", "Suecia"], answer: 1, hint: "Fue en la ronda final, no fue técnicamente una final" },
  { q: "¿Quién es el DT que dirigió a España en el Mundial 2010?", options: ["Del Bosque", "Luis Enrique", "Aragonés", "Lopetegui"], answer: 0, hint: "Había sido DT del Real Madrid" },
  { q: "¿En qué año Alemania goleó 7-1 a Brasil como local?", options: ["2010", "2014", "2018", "2006"], answer: 1, hint: "Semifinal en Belo Horizonte" },
  { q: "¿Quién convirtió el gol del triunfo de Argentina en la final del Mundial '86?", options: ["Maradona", "Valdano", "Burruchaga", "Brown"], answer: 2, hint: "Fue el 3-2 sobre Alemania" },
  { q: "¿Qué país fue sede del Mundial 2018?", options: ["Qatar", "Brasil", "Rusia", "Sudáfrica"], answer: 2, hint: "Francia ganó esa edición" },
  { q: "¿Qué jugador ganó el Balón de Oro del Mundial 1998?", options: ["Zidane", "Ronaldo", "Rivaldo", "Suker"], answer: 0, hint: "Francés, hizo 2 goles en la final" },
];

// MEDIUM: dedicated WC fans know these
const MEDIUM: Question[] = [
  { q: "¿Quién fue el arquero titular de Italia en la final del Mundial 2006?", options: ["Buffon", "Peruzzi", "Toldo", "Dida"], answer: 0, hint: "Jugó en Juventus casi toda su carrera" },
  { q: "¿Qué jugador colombiano fue asesinado tras el Mundial 1994 por un autogol?", options: ["Valderrama", "Asprilla", "Escobar", "Rincón"], answer: 2, hint: "Andrés, defensor" },
  { q: "¿Cuántos goles hizo Ronaldo (el brasileño) en el Mundial 2002?", options: ["6", "8", "10", "5"], answer: 1, hint: "Fue goleador del torneo" },
  { q: "¿Qué país organizó el Mundial por segunda vez en 1986 tras reemplazar a Colombia?", options: ["USA", "México", "Argentina", "Chile"], answer: 1, hint: "La sede original tuvo problemas económicos" },
  { q: "¿Quién le atajó dos penales a Países Bajos en la semifinal del Mundial 2014?", options: ["Romero", "Neuer", "Bravo", "Navas"], answer: 0, hint: "Argentino, jugaba en el Mónaco" },
  { q: "¿Qué selección fue la primera asiática en llegar a semifinales de un Mundial?", options: ["Japón", "Corea del Sur", "Arabia Saudita", "Australia"], answer: 1, hint: "Fue en 2002, como co-anfitrión" },
  { q: "¿Qué jugador marcó el 'Gol del Siglo' según la FIFA votado en 2002?", options: ["Pelé vs Suecia 1958", "Maradona vs Inglaterra 1986", "Carlos Alberto vs Italia 1970", "Bergkamp vs Argentina 1998"], answer: 1, hint: "Arrancó desde su propia mitad de cancha" },
  { q: "¿Quién es el jugador con más partidos en la historia de los Mundiales?", options: ["Miroslav Klose", "Lothar Matthäus", "Paolo Maldini", "Cafu"], answer: 1, hint: "Alemán, 25 partidos en 5 Mundiales" },
  { q: "¿Qué entrenador ganó el Mundial como jugador y como DT?", options: ["Zagallo", "Beckenbauer", "Didier Deschamps", "Los tres"], answer: 3, hint: "Zagallo ('58/'62 y '70), Beckenbauer ('74 y '90), Deschamps ('98 y '18)" },
  { q: "¿Cuál fue la primera selección africana en llegar a cuartos de final?", options: ["Nigeria", "Camerún", "Ghana", "Senegal"], answer: 1, hint: "Fue en Italia 1990, con Roger Milla" },
  { q: "¿Quién metió el gol de oro que le dio el Mundial 2002 a Brasil en la final?", options: ["Rivaldo", "Ronaldo", "Ronaldinho", "Cafu"], answer: 1, hint: "Hizo los dos goles contra Alemania" },
  { q: "¿Cuántos penales erró Argentina en la tanda vs Francia en la final 2022?", options: ["0", "1", "2", "3"], answer: 0, hint: "Fueron perfectos: 4 de 4" },
];

// HARD: only true WC historians know these
const HARD: Question[] = [
  { q: "¿Quién fue el primer jugador en ser expulsado en una final de Mundial?", options: ["Zidane", "Beckham", "Pedro Monzón", "Marcel Desailly"], answer: 2, hint: "Argentino, en Italia 1990 vs Alemania" },
  { q: "¿Qué selección se retiró de la cancha en el Mundial 1938 por una disputa política?", options: ["Austria", "España", "Alemania", "India"], answer: 0, hint: "Fue anexada al Tercer Reich antes del torneo" },
  { q: "¿Cuántos goles marcó Just Fontaine en el Mundial 1958?", options: ["10", "11", "13", "15"], answer: 2, hint: "Récord imbatible en un solo Mundial" },
  { q: "¿Qué árbitro cobró el penal para Argentina de Messi en la final 2022?", options: ["Néstor Pitana", "Szymon Marciniak", "Cüneyt Çakır", "Wilton Sampaio"], answer: 1, hint: "Polaco" },
  { q: "¿En qué Mundial se usó por primera vez el balón Adidas Tango?", options: ["1974", "1978", "1982", "1970"], answer: 1, hint: "El primer Mundial en Argentina" },
  { q: "¿Qué jugador tiene el récord de goles en fase de grupos de un solo Mundial?", options: ["Just Fontaine", "Sándor Kocsis", "Gerd Müller", "Eusébio"], answer: 0, hint: "Francés, en Suecia 1958" },
  { q: "¿Cuál fue el único Mundial donde no se cantaron himnos antes de los partidos?", options: ["1930", "1934", "1950", "1954"], answer: 2, hint: "Brasil como anfitrión, usó un formato de liga" },
  { q: "¿Qué jugador anotó en dos finales de Mundial separadas por 20 años?", options: ["Pelé", "Cafu", "Vavá", "Ronaldo"], answer: 2, hint: "Brasil '58 y '62... pero la pregunta dice 20 años" },
  { q: "¿Cuántos autogoles hubo en el Mundial 2018 de Rusia?", options: ["8", "10", "12", "6"], answer: 2, hint: "Récord histórico de autogoles" },
  { q: "¿Qué selección fue descalificada del Mundial 2010 por intervención gubernamental en su federación?", options: ["Nigeria", "Irak", "Chad", "Ninguna fue descalificada"], answer: 3, hint: "Varias fueron amenazadas pero ninguna fue descalificada en esa edición" },
  { q: "¿Quién fue el jugador más joven en disputar un partido de Mundial?", options: ["Pelé", "Norman Whiteside", "Femi Opabunmi", "Salomon Olembé"], answer: 1, hint: "Norirlandés, tenía 17 años y 41 días en España 1982" },
  { q: "¿Qué DT perdió dos finales de Mundial con selecciones diferentes?", options: ["Carlos Bilardo", "Vittorio Pozzo", "Ernst Happel", "Ninguno"], answer: 3, hint: "Trampa: Pozzo ganó dos, y nadie perdió dos con distintas selecciones" },
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
