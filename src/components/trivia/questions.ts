export interface Question {
  q: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  hint: string;
}

// EASY (30): any WC fan should know these — pick 6 per game
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
  { q: "¿Qué país ganó el primer Mundial europeo en 1934?", options: ["Alemania", "Italia", "España", "Francia"], answer: 1, hint: "Mussolini era presidente en ese entonces" },
  { q: "¿Cuántos países organizan el Mundial 2026?", options: ["1", "2", "3", "4"], answer: 2, hint: "USA, México y Canadá" },
  { q: "¿Qué selección es conocida como 'La Naranja Mecánica'?", options: ["Bélgica", "Países Bajos", "Alemania", "Dinamarca"], answer: 1, hint: "Por su camiseta naranja y fútbol total" },
  { q: "¿Quién ganó el Balón de Oro del Mundial 2022?", options: ["Mbappé", "Messi", "Modric", "Martínez"], answer: 1, hint: "Capitán argentino" },
  { q: "¿En qué continente se jugó el Mundial 2010?", options: ["Asia", "Europa", "América", "África"], answer: 3, hint: "Primer mundial en ese continente, con las vuvuzelas" },
  { q: "¿Qué selección ganó tres Mundiales consecutivos entre 1934 y 1950?", options: ["Brasil", "Uruguay", "Italia", "Ninguna"], answer: 3, hint: "No hubo Mundial en 1942 y 1946 por la guerra" },
  { q: "¿Quién metió el gol de la final del Mundial 2010?", options: ["Xavi", "Villa", "Iniesta", "Puyol"], answer: 2, hint: "Gol en el alargue contra Países Bajos" },
  { q: "¿Qué selección sudamericana llegó a la final del Mundial 2014?", options: ["Brasil", "Argentina", "Colombia", "Uruguay"], answer: 1, hint: "Perdió contra Alemania con gol de Götze" },
  { q: "¿Cuántos goles hizo Pelé en Mundiales?", options: ["8", "10", "12", "14"], answer: 2, hint: "En 4 Mundiales (1958-1970)" },
  { q: "¿Qué equipo ganó el Mundial 2002?", options: ["Alemania", "Corea del Sur", "Brasil", "Turquía"], answer: 2, hint: "Ronaldo fue la figura" },
  { q: "¿En qué país se jugó el Mundial 1970?", options: ["Brasil", "México", "Argentina", "Chile"], answer: 1, hint: "Brasil ganó con Pelé su tercer título" },
  { q: "¿Qué selección africana llegó a cuartos de final en 2010?", options: ["Nigeria", "Camerún", "Ghana", "Sudáfrica"], answer: 2, hint: "Asamoah Gyan erró un penal clave vs Uruguay" },
  { q: "¿Quién es el jugador con más Mundiales disputados?", options: ["Messi", "Cristiano Ronaldo", "Matthaus", "Carbajal"], answer: 3, hint: "Arquero mexicano, jugó 5 Mundiales (1950-1966)" },
  { q: "¿Qué selección fue campeona invicta en el Mundial 1978?", options: ["Brasil", "Países Bajos", "Argentina", "Alemania"], answer: 2, hint: "Como local, con Kempes como figura" },
  { q: "¿En qué Mundial debutó el sistema de tarjetas amarillas y rojas?", options: ["1966", "1970", "1974", "1978"], answer: 1, hint: "Fueron idea del árbitro inglés Ken Aston" },
  { q: "¿Qué país ganó el Mundial femenino 2023?", options: ["USA", "España", "Inglaterra", "Alemania"], answer: 1, hint: "Primera vez para esa selección" },
  { q: "¿Cuál fue la sede del último Mundial de un solo país antes de 2026?", options: ["Rusia 2018", "Brasil 2014", "Qatar 2022", "Sudáfrica 2010"], answer: 2, hint: "El más reciente antes de la sede triple" },
  { q: "¿Qué selección tiene más subcampeonatos mundiales?", options: ["Países Bajos", "Argentina", "Alemania", "Brasil"], answer: 2, hint: "Perdieron 4 finales" },
];

// MEDIUM (20): dedicated WC fans know these — pick 5 per game
const MEDIUM: Question[] = [
  { q: "¿Quién fue el arquero titular de Italia en la final del Mundial 2006?", options: ["Buffon", "Peruzzi", "Toldo", "Dida"], answer: 0, hint: "Jugó en Juventus casi toda su carrera" },
  { q: "¿Qué jugador colombiano fue asesinado tras el Mundial 1994 por un autogol?", options: ["Valderrama", "Asprilla", "Escobar", "Rincón"], answer: 2, hint: "Andrés, defensor" },
  { q: "¿Cuántos goles hizo Ronaldo (el brasileño) en el Mundial 2002?", options: ["6", "8", "10", "5"], answer: 1, hint: "Fue goleador del torneo" },
  { q: "¿Qué país organizó el Mundial por segunda vez en 1986 tras reemplazar a Colombia?", options: ["USA", "México", "Argentina", "Chile"], answer: 1, hint: "La sede original tuvo problemas económicos" },
  { q: "¿Quién le atajó dos penales a Países Bajos en la semifinal del Mundial 2014?", options: ["Romero", "Neuer", "Bravo", "Navas"], answer: 0, hint: "Argentino, jugaba en el Mónaco" },
  { q: "¿Qué selección fue la primera asiática en llegar a semifinales de un Mundial?", options: ["Japón", "Corea del Sur", "Arabia Saudita", "Australia"], answer: 1, hint: "Fue en 2002, como co-anfitrión" },
  { q: "¿Quién es el jugador con más partidos en la historia de los Mundiales?", options: ["Miroslav Klose", "Lothar Matthäus", "Paolo Maldini", "Cafu"], answer: 1, hint: "Alemán, 25 partidos en 5 Mundiales" },
  { q: "¿Qué entrenador ganó el Mundial como jugador y como DT?", options: ["Zagallo", "Beckenbauer", "Deschamps", "Los tres"], answer: 3, hint: "Zagallo ('58/'62 y '70), Beckenbauer ('74 y '90), Deschamps ('98 y '18)" },
  { q: "¿Cuál fue la primera selección africana en llegar a cuartos de final?", options: ["Nigeria", "Camerún", "Ghana", "Senegal"], answer: 1, hint: "Fue en Italia 1990, con Roger Milla" },
  { q: "¿Cuántos penales erró Argentina en la tanda vs Francia en la final 2022?", options: ["0", "1", "2", "3"], answer: 0, hint: "Fueron perfectos: 4 de 4" },
  { q: "¿Qué jugador hizo el gol más rápido en un debut mundialista para su selección en 2002?", options: ["Hakan Şükür", "Ronaldo", "Rivaldo", "Ilhan Mansiz"], answer: 0, hint: "Turco, a los 11 segundos vs Corea del Sur" },
  { q: "¿Qué país fue el primer eliminado del Mundial 2014 pese a ser campeón vigente?", options: ["Italia", "Francia", "España", "Alemania"], answer: 2, hint: "Había ganado en Sudáfrica 2010" },
  { q: "¿Quién dirigió a Alemania en la goleada 7-1 vs Brasil?", options: ["Klinsmann", "Löw", "Flick", "Heynckes"], answer: 1, hint: "Dirigió a Alemania desde 2006 hasta 2021" },
  { q: "¿Qué selección eliminó a Italia en el Mundial 2002?", options: ["Corea del Sur", "Japón", "Ecuador", "Brasil"], answer: 0, hint: "Partido polémico con arbitraje cuestionado" },
  { q: "¿Quién fue el goleador del Mundial 2014?", options: ["Müller", "Messi", "Neymar", "James Rodríguez"], answer: 3, hint: "Colombiano, con 6 goles" },
  { q: "¿En qué Mundial se usó por primera vez la tecnología de línea de gol?", options: ["2010", "2014", "2018", "2022"], answer: 1, hint: "En Brasil, tras el gol fantasma de Lampard en 2010" },
  { q: "¿Qué jugador convirtió el penal decisivo de Argentina en la final 2022?", options: ["Messi", "Dybala", "Montiel", "Di María"], answer: 2, hint: "Lateral derecho del Sevilla en ese momento" },
  { q: "¿Cuántos Mundiales ganó Alemania?", options: ["3", "4", "5", "2"], answer: 1, hint: "'54, '74, '90 y 2014" },
  { q: "¿Qué selección sorprendió al mundo llegando a semifinales del Mundial 2018?", options: ["Rusia", "Croacia", "Bélgica", "Las tres"], answer: 3, hint: "Croacia llegó a la final, Rusia y Bélgica a semis" },
  { q: "¿Quién anotó el gol de Di María en la final del Mundial 2022?", options: ["Pase de Messi", "Pase de Mac Allister", "Pase de Molina", "Pase de De Paul"], answer: 1, hint: "Contraataque largo que terminó en Fideo" },
];

// HARD (15): only true WC historians know these — pick 4 per game
const HARD: Question[] = [
  { q: "¿Quién fue el primer jugador en ser expulsado en una final de Mundial?", options: ["Zidane", "Beckham", "Pedro Monzón", "Marcel Desailly"], answer: 2, hint: "Argentino, en Italia 1990 vs Alemania" },
  { q: "¿Cuántos goles marcó Just Fontaine en el Mundial 1958?", options: ["10", "11", "13", "15"], answer: 2, hint: "Récord imbatible en un solo Mundial" },
  { q: "¿Qué árbitro cobró el penal para Argentina de Messi en la final 2022?", options: ["Néstor Pitana", "Szymon Marciniak", "Cüneyt Çakır", "Wilton Sampaio"], answer: 1, hint: "Polaco" },
  { q: "¿En qué Mundial se usó por primera vez el balón Adidas Tango?", options: ["1974", "1978", "1982", "1970"], answer: 1, hint: "El primer Mundial en Argentina" },
  { q: "¿Cuántos autogoles hubo en el Mundial 2018 de Rusia?", options: ["8", "10", "12", "6"], answer: 2, hint: "Récord histórico de autogoles" },
  { q: "¿Quién fue el jugador más joven en disputar un partido de Mundial?", options: ["Pelé", "Norman Whiteside", "Femi Opabunmi", "Salomon Olembé"], answer: 1, hint: "Norirlandés, tenía 17 años y 41 días en España 1982" },
  { q: "¿Cuántos partidos jugó Italia invicta entre los Mundiales 1934 y 1954?", options: ["7", "11", "13", "No se sabe"], answer: 0, hint: "Ganó en '34 y '38, no hubo Mundial en '42 y '46, cayó en '54" },
  { q: "¿Qué selección fue la primera en usar el dorsal 1-11 en un Mundial?", options: ["Inglaterra", "Brasil", "Uruguay", "Italia"], answer: 0, hint: "En el Mundial de 1950" },
  { q: "¿Quién es el DT más joven en ganar un Mundial?", options: ["Zagallo", "Didier Deschamps", "Juan José Tramutola", "Vittorio Pozzo"], answer: 2, hint: "Argentino, tenía 27 años en 1930" },
  { q: "¿Qué selección tiene el récord de más goles en un solo Mundial?", options: ["Brasil 2002", "Francia 1998", "Hungría 1954", "Alemania 2014"], answer: 2, hint: "Metieron 27 goles en Suiza" },
  { q: "¿En qué año FIFA decidió que el país organizador clasifica automáticamente?", options: ["1930", "1934", "1938", "Siempre fue así"], answer: 3, hint: "Desde el primer Mundial" },
  { q: "¿Cuál fue el primer Mundial transmitido por televisión?", options: ["1950", "1954", "1958", "1962"], answer: 1, hint: "En Suiza, aunque con cobertura limitada" },
  { q: "¿Qué jugador anotó en la final de dos Mundiales diferentes?", options: ["Pelé", "Vavá", "Zidane", "Pelé y Vavá"], answer: 3, hint: "Pelé en '58 y '70, Vavá en '58 y '62" },
  { q: "¿Cuántos partidos se jugarán en el Mundial 2026?", options: ["64", "80", "104", "96"], answer: 2, hint: "Aumentó por la expansión a 48 equipos" },
  { q: "¿Qué selección ha perdido más finales de Mundial sin ganar nunca?", options: ["Países Bajos", "Hungría", "Checoslovaquia", "Países Bajos y Hungría"], answer: 0, hint: "Perdieron 3 finales (1974, 1978, 2010)" },
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
    ...shuffle(EASY).slice(0, 6),
    ...shuffle(MEDIUM).slice(0, 5),
    ...shuffle(HARD).slice(0, 4),
  ];
}

export const PRIZE_LADDER = [
  "Eliminatoria 1",
  "Eliminatoria 2",
  "Eliminatoria 3",
  "Eliminatoria 4",
  "Eliminatoria 5",
  "Eliminatoria 6",
  "Fase de Grupos 1",
  "Fase de Grupos 2",
  "Fase de Grupos 3",
  "Dieciseisavos",
  "Octavos",
  "Cuartos",
  "Semifinal",
  "Final",
  "¡Campeón!",
];

export const SAFETY_NETS = [5, 8];
