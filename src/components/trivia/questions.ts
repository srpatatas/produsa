export interface Question {
  q: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  hint: string;
}

// EASY (50): WC fans should know most — pick 6 per game
const EASY: Question[] = [
  { q: "¿Qué selección ganó el primer Mundial de la historia en 1930?", options: ["Argentina", "Brasil", "Uruguay", "Italia"], answer: 2, hint: "Fue el país anfitrión" },
  { q: "¿Quién hizo la 'Mano de Dios' en México 1986?", options: ["Valdano", "Maradona", "Burruchaga", "Batista"], answer: 1, hint: "El mismo que hizo el Gol del Siglo" },
  { q: "¿Qué selección ganó el Mundial 2006 en Alemania?", options: ["Francia", "Alemania", "Italia", "Brasil"], answer: 2, hint: "Zidane dio el cabezazo en la final" },
  { q: "¿Cuántos Mundiales ganó Brasil hasta 2022?", options: ["4", "5", "6", "3"], answer: 1, hint: "Es la selección más ganadora de la historia" },
  { q: "¿En qué ciudad se jugó la final del Mundial 2022?", options: ["Doha", "Lusail", "Al Khor", "Abu Dabi"], answer: 1, hint: "El estadio más grande de Qatar" },
  { q: "¿Qué jugador francés hizo un hat-trick en la final del Mundial 2022?", options: ["Griezmann", "Dembélé", "Mbappé", "Giroud"], answer: 2, hint: "Metió 2 en 97 segundos" },
  { q: "¿Qué selección eliminó a Brasil en el 'Maracanazo' de 1950?", options: ["Argentina", "Uruguay", "Paraguay", "Suecia"], answer: 1, hint: "Fue en la ronda final, no fue técnicamente una final" },
  { q: "¿Quién es el DT que dirigió a España en el Mundial 2010?", options: ["Del Bosque", "Luis Enrique", "Aragonés", "Lopetegui"], answer: 0, hint: "Había sido DT del Real Madrid" },
  { q: "¿En qué año Alemania goleó 7-1 a Brasil en un Mundial?", options: ["2010", "2014", "2018", "2006"], answer: 1, hint: "Semifinal en Belo Horizonte" },
  { q: "¿Quién convirtió el gol del triunfo de Argentina en la final del Mundial '86?", options: ["Maradona", "Valdano", "Burruchaga", "Brown"], answer: 2, hint: "Fue el 3-2 sobre Alemania" },
  { q: "¿Qué país fue sede del Mundial 2018?", options: ["Qatar", "Brasil", "Rusia", "Sudáfrica"], answer: 2, hint: "Francia ganó esa edición" },
  { q: "¿Qué jugador ganó el Balón de Oro del Mundial 1998?", options: ["Zidane", "Ronaldo", "Rivaldo", "Suker"], answer: 0, hint: "Francés, hizo 2 goles en la final" },
  { q: "¿Qué país ganó el Mundial de 1934?", options: ["Alemania", "Italia", "España", "Francia"], answer: 1, hint: "Fue como local" },
  { q: "¿Cuántos países organizan el Mundial 2026?", options: ["1", "2", "3", "4"], answer: 2, hint: "USA, México y Canadá" },
  { q: "¿Qué selección es conocida como 'La Naranja Mecánica'?", options: ["Bélgica", "Países Bajos", "Alemania", "Dinamarca"], answer: 1, hint: "Por su camiseta naranja y fútbol total" },
  { q: "¿En qué continente se jugó el Mundial 2010?", options: ["Asia", "Europa", "América", "África"], answer: 3, hint: "Primer mundial en ese continente" },
  { q: "¿Quién metió el gol de la final del Mundial 2010?", options: ["Xavi", "Villa", "Iniesta", "Puyol"], answer: 2, hint: "Gol en el alargue contra Países Bajos" },
  { q: "¿Qué selección sudamericana llegó a la final del Mundial 2014?", options: ["Brasil", "Argentina", "Colombia", "Uruguay"], answer: 1, hint: "Perdió contra Alemania con gol de Götze" },
  { q: "¿Qué equipo ganó el Mundial 2002?", options: ["Alemania", "Corea del Sur", "Brasil", "Turquía"], answer: 2, hint: "Ronaldo fue la figura" },
  { q: "¿En qué país se jugó el Mundial 1970?", options: ["Brasil", "México", "Argentina", "Chile"], answer: 1, hint: "Brasil ganó su tercer título ahí" },
  { q: "¿Qué selección africana llegó a cuartos de final en 2010?", options: ["Nigeria", "Camerún", "Ghana", "Sudáfrica"], answer: 2, hint: "Asamoah Gyan erró un penal clave vs Uruguay" },
  { q: "¿Qué selección fue campeona del Mundial 1978?", options: ["Brasil", "Países Bajos", "Argentina", "Alemania"], answer: 2, hint: "Kempes fue la figura del torneo" },
  { q: "¿Qué selección tiene más subcampeonatos mundiales?", options: ["Países Bajos", "Argentina", "Alemania", "Brasil"], answer: 2, hint: "Perdieron 4 finales" },
  { q: "¿Quién ganó el Balón de Oro del Mundial 2022?", options: ["Mbappé", "Messi", "Modric", "Martínez"], answer: 1, hint: "Capitán argentino" },
  { q: "¿Qué selección eliminó a Alemania en fase de grupos del Mundial 2018?", options: ["México", "Suecia", "Corea del Sur", "Las tres"], answer: 2, hint: "Gol en el descuento, resultado histórico" },
  { q: "¿Quién fue el goleador del Mundial 2010?", options: ["Villa", "Forlán", "Müller", "Sneijder"], answer: 2, hint: "Alemán, joven revelación del torneo" },
  { q: "¿En qué Mundial se usó por primera vez el VAR?", options: ["2014", "2018", "2022", "2010"], answer: 1, hint: "En Rusia" },
  { q: "¿Qué selección eliminó a España del Mundial 2022?", options: ["Brasil", "Marruecos", "Japón", "Alemania"], answer: 1, hint: "Sorpresa africana en octavos" },
  { q: "¿Cuántos goles hizo Pelé en Mundiales?", options: ["8", "10", "12", "14"], answer: 2, hint: "En 4 Mundiales (1958-1970)" },
  { q: "¿Qué selección ganó el primer Mundial después de la Segunda Guerra?", options: ["Brasil", "Uruguay", "Italia", "Inglaterra"], answer: 1, hint: "Fue en 1950, otra vez" },
  { q: "¿Quién fue el máximo goleador del Mundial 1986?", options: ["Maradona", "Lineker", "Butragueño", "Platini"], answer: 1, hint: "Inglés, con 6 goles" },
  { q: "¿Qué país organizó el primer Mundial con 32 equipos?", options: ["USA 1994", "Francia 1998", "Corea-Japón 2002", "Alemania 2006"], answer: 1, hint: "Se expandió de 24 a 32" },
  { q: "¿Cuál fue el resultado de la final del Mundial 2018?", options: ["Francia 4-2 Croacia", "Francia 3-1 Croacia", "Francia 2-1 Croacia", "Francia 1-0 Croacia"], answer: 0, hint: "Griezmann, Pogba y Mbappé marcaron" },
  { q: "¿Qué arquero fue figura de la selección alemana en el Mundial 2014?", options: ["Ter Stegen", "Neuer", "Kahn", "Lehmann"], answer: 1, hint: "Famoso por salir jugando como líbero" },
  { q: "¿Quién marcó el gol más rápido en la historia de las finales de un Mundial?", options: ["Zidane", "Hurst", "Mbappé", "Pelé"], answer: 0, hint: "Penal a los 7 minutos en la final de 2006" },
  { q: "¿Qué país fue el primer campeón del mundo en perder en primera ronda del siguiente Mundial?", options: ["Francia", "Italia", "Brasil", "España"], answer: 0, hint: "Ganó en 1998, eliminada en grupos en 2002" },
  { q: "¿Cuál fue el último Mundial en el que participó Maradona como jugador?", options: ["Italia 1990", "USA 1994", "Francia 1998", "México 1986"], answer: 1, hint: "No terminó el torneo" },
  { q: "¿Qué estilo de juego fue asociado al campeón del Mundial 2010?", options: ["Catenaccio", "Tiki-taka", "Fútbol total", "Gegenpressing"], answer: 1, hint: "Xavi e Iniesta eran los motores" },
  { q: "¿Cuántos mundiales ganó Francia hasta 2022?", options: ["1", "2", "3", "4"], answer: 1, hint: "1998 y 2018" },
  { q: "¿Qué jugador anotó en los Mundiales 2006, 2010, 2014 y 2018?", options: ["Messi", "Cristiano Ronaldo", "Miroslav Klose", "Müller"], answer: 2, hint: "Alemán, máximo goleador histórico de Mundiales" },
  { q: "¿Qué selección fue la primera en ganar un Mundial fuera de su continente?", options: ["Brasil", "Argentina", "España", "Brasil"], answer: 0, hint: "En Suecia 1958" },
  { q: "¿Cuál fue la sede de la final del Mundial 2014?", options: ["Brasilia", "São Paulo", "Río de Janeiro", "Belo Horizonte"], answer: 2, hint: "En el Maracaná" },
  { q: "¿Qué selección centroamericana llegó a cuartos de final del Mundial 2014?", options: ["México", "Honduras", "Costa Rica", "Panamá"], answer: 2, hint: "Eliminó a Italia y pasó primera de grupo" },
  { q: "¿Quién marcó el gol del triunfo de Alemania en la final del Mundial 2014?", options: ["Müller", "Götze", "Kroos", "Schweinsteiger"], answer: 1, hint: "Gol de volea con el pecho en el alargue" },
  { q: "¿Qué selección ganó el tercer puesto del Mundial 2022?", options: ["Francia", "Marruecos", "Croacia", "Países Bajos"], answer: 2, hint: "Su segunda medalla de bronce consecutiva" },
  { q: "¿Quién fue el capitán de Brasil en el Mundial 2002?", options: ["Roberto Carlos", "Rivaldo", "Cafu", "Ronaldo"], answer: 2, hint: "Lateral derecho, jugó 4 finales mundiales" },
  { q: "¿Qué selección asiática venció a Alemania en el Mundial 2022?", options: ["Corea del Sur", "Japón", "Arabia Saudita", "Australia"], answer: 1, hint: "Remontada 2-1 en fase de grupos" },
  { q: "¿Quién fue el DT de Argentina en el Mundial 2022?", options: ["Sampaoli", "Scaloni", "Pochettino", "Gallardo"], answer: 1, hint: "Ex ayudante de Sampaoli" },
  { q: "¿Qué país fue sede del Mundial 1994?", options: ["México", "Canadá", "USA", "Japón"], answer: 2, hint: "La final fue en Los Ángeles" },
];

// MEDIUM (30): dedicated WC fans — pick 5 per game
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
  { q: "¿Quién dirigió a Alemania en la goleada 7-1 vs Brasil?", options: ["Klinsmann", "Löw", "Flick", "Heynckes"], answer: 1, hint: "Dirigió a Alemania desde 2006 hasta 2021" },
  { q: "¿Qué selección eliminó a Italia en el Mundial 2002?", options: ["Corea del Sur", "Japón", "Ecuador", "Brasil"], answer: 0, hint: "Partido polémico con arbitraje cuestionado" },
  { q: "¿Quién fue el goleador del Mundial 2014?", options: ["Müller", "Messi", "Neymar", "James Rodríguez"], answer: 3, hint: "Colombiano, con 6 goles" },
  { q: "¿En qué Mundial se usó por primera vez la tecnología de línea de gol?", options: ["2010", "2014", "2018", "2022"], answer: 1, hint: "En Brasil, tras el gol fantasma de Lampard en 2010" },
  { q: "¿Qué jugador convirtió el penal decisivo de Argentina en la final 2022?", options: ["Messi", "Dybala", "Montiel", "Di María"], answer: 2, hint: "Lateral derecho del Sevilla en ese momento" },
  { q: "¿Cuántos Mundiales ganó Alemania?", options: ["3", "4", "5", "2"], answer: 1, hint: "'54, '74, '90 y 2014" },
  { q: "¿Quién anotó el gol de Di María en la final del Mundial 2022?", options: ["Pase de Messi", "Pase de Mac Allister", "Pase de Molina", "Pase de De Paul"], answer: 1, hint: "Contraataque largo que terminó en Fideo" },
  { q: "¿Qué selección ganó sus primeros 6 Mundiales invicta como local?", options: ["Brasil", "Italia", "Alemania", "Ninguna llegó a 6"], answer: 3, hint: "Es un mito — todos perdieron algún partido como locales" },
  { q: "¿Quién es el único jugador que ganó 3 Mundiales?", options: ["Maradona", "Pelé", "Zagallo", "Cafu"], answer: 1, hint: "1958, 1962 y 1970 con Brasil" },
  { q: "¿Qué jugador erró el penal decisivo en la final de USA 1994?", options: ["Baresi", "Baggio", "Massaro", "Albertini"], answer: 1, hint: "El Divino Codino, por encima del travesaño" },
  { q: "¿Qué selección eliminó a Argentina del Mundial 2006?", options: ["Alemania", "Francia", "Italia", "Brasil"], answer: 0, hint: "En cuartos de final, por penales" },
  { q: "¿Cuántos goles marcó Messi en el Mundial 2022?", options: ["5", "7", "8", "6"], answer: 1, hint: "Goleador del torneo junto a Mbappé" },
  { q: "¿Qué selección debutó en un Mundial ganando a Francia 1-0 en 2002?", options: ["China", "Senegal", "Trinidad y Tobago", "Eslovenia"], answer: 1, hint: "Africanos que llegaron a cuartos en su primer Mundial" },
  { q: "¿Quién fue el DT de Italia cuando ganó el Mundial 2006?", options: ["Ancelotti", "Capello", "Lippi", "Trapattoni"], answer: 2, hint: "También dirigió a Juventus" },
  { q: "¿Qué defensor argentino marcó el primer gol en la final del Mundial 1978?", options: ["Tarantini", "Passarella", "Galván", "Kempes"], answer: 3, hint: "Trampa: Kempes no era defensor, fue el goleador" },
  { q: "¿En qué estadio se jugó la final del Mundial 2022?", options: ["Al Bayt", "Lusail", "Ahmad bin Ali", "Khalifa International"], answer: 1, hint: "80.000 espectadores, en forma de fanal" },
  { q: "¿Qué selección fue semifinalista sorpresa del Mundial 1994?", options: ["Bulgaria", "Rumania", "Nigeria", "Arabia Saudita"], answer: 0, hint: "Stoichkov fue su figura" },
  { q: "¿Cuántos Mundiales jugó Lionel Messi?", options: ["4", "5", "6", "3"], answer: 1, hint: "2006, 2010, 2014, 2018, 2022" },
  { q: "¿Qué selección fue eliminada con el 'Gol de Oro' de Francia en el Mundial 2000?", options: ["No hubo Mundial en 2000", "Italia", "España", "Brasil"], answer: 0, hint: "El Mundial es cada 4 años" },
  { q: "¿Quién anotó el famoso gol de chilena contra Alemania en el Mundial 2018?", options: ["Cristiano Ronaldo", "Giroud", "Nacho", "No pasó en 2018"], answer: 3, hint: "La chilena famosa fue de Giroud vs Australia en 2022... o no?" },
];

// HARD (15): only true WC historians — pick 4 per game
const HARD: Question[] = [
  { q: "¿Quién fue el primer jugador en ser expulsado en una final de Mundial?", options: ["Zidane", "Beckham", "Pedro Monzón", "Marcel Desailly"], answer: 2, hint: "Argentino, en Italia 1990 vs Alemania" },
  { q: "¿Cuántos goles marcó Just Fontaine en el Mundial 1958?", options: ["10", "11", "13", "15"], answer: 2, hint: "Récord imbatible en un solo Mundial" },
  { q: "¿Qué árbitro cobró el penal para Argentina de Messi en la final 2022?", options: ["Néstor Pitana", "Szymon Marciniak", "Cüneyt Çakır", "Wilton Sampaio"], answer: 1, hint: "Polaco" },
  { q: "¿En qué Mundial se usó por primera vez el balón Adidas Tango?", options: ["1974", "1978", "1982", "1970"], answer: 1, hint: "El primer Mundial en Argentina" },
  { q: "¿Cuántos autogoles hubo en el Mundial 2018 de Rusia?", options: ["8", "10", "12", "6"], answer: 2, hint: "Récord histórico de autogoles" },
  { q: "¿Quién fue el jugador más joven en disputar un partido de Mundial?", options: ["Pelé", "Norman Whiteside", "Femi Opabunmi", "Salomon Olembé"], answer: 1, hint: "Norirlandés, tenía 17 años y 41 días en España 1982" },
  { q: "¿Quién es el DT más joven en ganar un Mundial?", options: ["Zagallo", "Didier Deschamps", "Juan José Tramutola", "Vittorio Pozzo"], answer: 2, hint: "Argentino, tenía 27 años en 1930" },
  { q: "¿Qué selección tiene el récord de más goles en un solo Mundial?", options: ["Brasil 2002", "Francia 1998", "Hungría 1954", "Alemania 2014"], answer: 2, hint: "Metieron 27 goles en Suiza" },
  { q: "¿Cuál fue el primer Mundial transmitido por televisión?", options: ["1950", "1954", "1958", "1962"], answer: 1, hint: "En Suiza, aunque con cobertura limitada" },
  { q: "¿Qué jugadores anotaron en finales de dos Mundiales diferentes?", options: ["Solo Pelé", "Solo Vavá", "Pelé y Vavá", "Pelé, Vavá y Zidane"], answer: 3, hint: "Pelé ('58 y '70), Vavá ('58 y '62), Zidane ('98 y '06)" },
  { q: "¿Cuántos partidos se jugarán en el Mundial 2026?", options: ["64", "80", "104", "96"], answer: 2, hint: "Aumentó por la expansión a 48 equipos" },
  { q: "¿Qué selección ha perdido más finales de Mundial sin ganar nunca?", options: ["Países Bajos", "Hungría", "Checoslovaquia", "Suecia"], answer: 0, hint: "Perdieron 3 finales (1974, 1978, 2010)" },
  { q: "¿Quién marcó el gol más rápido en la historia de los Mundiales?", options: ["Hakan Şükür", "Davide Gualtieri", "Clint Dempsey", "Neymar"], answer: 0, hint: "A los 11 segundos, tercer puesto de 2002" },
  { q: "¿En qué Mundial se usaron por primera vez las tarjetas amarillas y rojas?", options: ["1966", "1970", "1974", "1962"], answer: 1, hint: "Idea del árbitro inglés Ken Aston, inspirado en un semáforo" },
  { q: "¿Cuántas selecciones participaron en el primer Mundial de 1930?", options: ["16", "13", "10", "8"], answer: 1, hint: "Muchos europeos no viajaron por la distancia a Uruguay" },
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
  { stage: "Eliminatoria 1", money: "$100" },
  { stage: "Eliminatoria 2", money: "$200" },
  { stage: "Eliminatoria 3", money: "$300" },
  { stage: "Eliminatoria 4", money: "$500" },
  { stage: "Eliminatoria 5", money: "$1.000" },
  { stage: "Eliminatoria 6", money: "$2.000" },
  { stage: "Fase de Grupos 1", money: "$4.000" },
  { stage: "Fase de Grupos 2", money: "$8.000" },
  { stage: "Fase de Grupos 3", money: "$16.000" },
  { stage: "Dieciseisavos", money: "$32.000" },
  { stage: "Octavos", money: "$64.000" },
  { stage: "Cuartos", money: "$125.000" },
  { stage: "Semifinal", money: "$250.000" },
  { stage: "Final", money: "$500.000" },
  { stage: "¡Campeón!", money: "$1.000.000" },
];

export const SAFETY_NETS = [5, 8];
