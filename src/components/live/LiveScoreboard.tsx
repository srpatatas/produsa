import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { UnifiedMatch, LiveScore } from "@/types";
import { getTeam } from "@/data/teams";
import { FlagImage } from "@/components/teams/FlagImage";
import { LiveEventTimeline } from "./LiveEventTimeline";
import { getComodinConfig } from "@/data/comodinConfig";

interface ComodinPred {
  name: string;
  outcome: string;
  exactHome: number | null;
  exactAway: number | null;
  isComodin: boolean;
}

// Personality voice — how each comodin reacts to game events
interface PersonalityVoice {
  goal: (scorer: string, min: number, side: string, h: number, a: number) => string;
  ownGoal: (scorer: string, min: number) => string;
  redCard: (player: string, min: number) => string;
  yellowCard: (player: string, min: number) => string;
  penalty: (scorer: string, min: number) => string;
  scoreless: (min: number) => string;
  lateGame: (h: number, a: number) => string;
  comodinWinning: (name: string, h: number, a: number) => string;
  comodinLosing: (name: string, h: number, a: number) => string;
  comodinExactHit: (name: string, h: number, a: number) => string;
  nobodyRight: () => string;
  fewRight: (names: string) => string;
  idle: () => string;
  taunt: (name: string) => string;
  rankingTaunt: (name: string, pos: number, diff: number) => string;
}

const usedPhrases = new Set<string>();
function pick<T>(arr: T[]): T {
  if (arr.length <= 1) return arr[0];
  const fresh = arr.filter((v) => !usedPhrases.has(String(v)));
  const pool = fresh.length > 0 ? fresh : arr;
  if (fresh.length === 0) usedPhrases.clear();
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  usedPhrases.add(String(chosen));
  return chosen;
}

const VOICES: Record<string, PersonalityVoice> = {
  "fecha-1": { // Chiqui
    goal: (s, m, _side, h, a) => pick([
      `Gol de ${s} en el minuto ${m}. ${h}-${a}. Yo lo hubiese anulado`,
      `¡${s} la metió! ${h}-${a}. La FIFA va a revisar esto`,
      `${s}, minuto ${m}. Le voy a avisar a Conmebol que hay gol`,
      `${h}-${a}. ${s} convirtió en el ${m}'. Voy a pedir el VAR`,
      `¡Gol! ${s} en el ${m}'. La AFA no fue consultada sobre este gol`,
      `${s} metió el ${h}-${a} en el ${m}'. Esto va al tribunal de disciplina`,
      `¡${h}-${a}! ${s} festeja pero yo no lo autorizo`,
      `Minuto ${m}, gol de ${s}. Le voy a poner una multa al arquero`,
    ]),
    ownGoal: (s, m) => pick([`En contra de ${s} en el ${m}'. Esto es un escándalo para la FIFA`, `¡Autogol de ${s}! En el ${m}'. Voy a pedir explicaciones`]),
    redCard: (p, m) => pick([`¡Roja para ${p} en el ${m}'! Yo lo hubiese expulsado antes`, `${p} se va expulsado. Le mando un fax de despedida`, `Roja para ${p} en el ${m}'. La AFA hubiera puesto 5 fechas mínimo`, `${p} afuera en el ${m}'. Esto lo sabía la FIFA y no dijo nada`]),
    yellowCard: (p, m) => pick([`Amarilla para ${p} en el ${m}'. La AFA toma nota`, `${p} amonestado. Ojo que la próxima lo suspendo yo`, `Amarilla para ${p}. Minuto ${m}. Le voy a mandar un memo`, `${p} con amarilla en el ${m}'. Está en la lista negra de la FIFA`]),
    penalty: (s, m) => pick([`¡Penal de ${s} en el ${m}'! Esto lo reviso con la FIFA`, `¡Penal! ${s} en el ${m}'. Yo lo cobré desde la tribuna`]),
    scoreless: (m) => pick([`${m} minutos y 0-0... esto no lo aprueba nadie`, `¿No piensan meter un gol? Le voy a avisar al árbitro`, `0-0 al minuto ${m}. Voy a mandar a investigar esto`, `${m}' y seguimos 0-0. La FIFA va a recibir una queja formal`]),
    lateGame: (h, a) => pick([`Últimos minutos, ${h}-${a}. Voy a llamar al VAR por las dudas`, `Se termina esto. ${h}-${a}. La AFA se pronunciará`, `${h}-${a} y quedan minutos. Le rezo a la Conmebol`, `Esto se acaba con ${h}-${a}. La FIFA tomará cartas en el asunto`]),
    comodinWinning: (n, h, a) => pick([`${n} puso el comodín y va ${h}-${a}... la AFA aprueba`, `¡${n} se frota las manos con ese +2!`, `${n} va ganando con el comodín. Lo voy a convocar al próximo congreso`]),
    comodinLosing: (n, h, a) => pick([`${n} puso el comodín con el ${h}-${a}... le mando un telegrama de pésame`, `El comodín de ${n} es un escándalo con este resultado`, `${n} y su comodín sufren con el ${h}-${a}. La AFA ofrece condolencias`]),
    comodinExactHit: (n, h, a) => pick([`¡${n} CLAVÓ el ${h}-${a}! ¿Tiene contacto con la FIFA?`, `¡${n} acertó el ${h}-${a}! Le voy a ofrecer un cargo en la AFA`]),
    nobodyRight: () => pick(["¡Casi nadie le pegó! Voy a investigar esto", "Nadie predijo esto. La FIFA tampoco"]),
    fewRight: (names) => pick([`Solo ${names} le están pegando, los demás... al banco`, `${names} nada más aciertan. El resto que hable con la AFA`]),
    idle: () => pick([
      "Acá estoy, supervisando este partido para la FIFA...",
      "La FIFA me pidió que mire atento...",
      "Esto está más trabado que un pase de jugador...",
      "Si estos pibes jugaran en la AFA, otra cosa sería",
      "Le voy a mandar un informe a Conmebol sobre este partido",
      "Yo cuando dirigía la AFA, los partidos eran mejores",
      "Este partido necesita una intervención de la FIFA",
      "Estoy tomando nota de todo para el próximo congreso",
      "Si el árbitro fuera de la AFA, esto sería diferente",
      "Esto me recuerda a la final del 78... bueno, no estuve, pero me contaron",
    ]),
    taunt: (n) => pick([
      `${n}, ¿esa predicción la aprobó la FIFA?`,
      `${n} está nervioso, lo noto desde acá`,
      `Le voy a avisar a ${n} que esto no va como esperaba`,
      `${n} transpira más que un dirigente en asamblea`,
      `A ${n} le recomiendo hablar con la AFA antes de predecir`,
    ]),
    rankingTaunt: (n, pos, diff) => {
      if (diff > 0) return pick([`${n} subió ${diff} puesto${diff > 1 ? "s" : ""}. La AFA toma nota`, `${n} trepa en la tabla, lo voy a convocar`]);
      if (diff < 0) return pick([`${n} cayó ${Math.abs(diff)} puesto${Math.abs(diff) > 1 ? "s" : ""}. Le mando un fax de pésame`, `${n} baja en la tabla... esto es un escándalo`]);
      if (pos === 1) return `${n} va primero. La FIFA aprueba`;
      if (pos <= 3) return `${n} va ${pos}°, ojo que se mete en el podio`;
      return pick([`${n} va ${pos}°... podría ser peor, podría ser dirigente`, `${n} en el puesto ${pos}, la AFA investiga`]);
    },
  },
  "fecha-2": { // Pollo
    goal: (s, m, _side, h, a) => pick([
      `¡¡GOOOOOL DE ${s.toUpperCase()} EN EL ${m}'!! ¡¡${h}-${a} SEÑORES!!`,
      `¡¡LA METIÓ ${s.toUpperCase()}!! ¡¡${h}-${a}!! ¡¡ESTO ES INCREÍBLE!!`,
      `¡¡${s.toUpperCase()}, MINUTO ${m}!! ¡¡${h}-${a}!! ¡¡QUÉ PARTIDAZO!!`,
      `¡¡GOOOOL!! ¡¡${s.toUpperCase()} LA CLAVÓ EN EL ${m}'!! ¡¡${h}-${a}!!`,
      `¡¡${h}-${a}!! ¡¡${s.toUpperCase()} NO PERDONA SEÑORES!! ¡¡MINUTO ${m}!!`,
      `¡¡SE GRITÓ GOL!! ¡¡${s.toUpperCase()}!! ¡¡${h}-${a} EN EL ${m}'!!`,
      `¡¡LA ROMPIÓ ${s.toUpperCase()}!! ¡¡${h}-${a}!! ¡¡QUÉ GOLAZO SEÑORES!!`,
      `¡¡ENTRÓ!! ¡¡${s.toUpperCase()} EN EL MINUTO ${m}!! ¡¡${h}-${a}!! ¡¡VAMOOOS!!`,
    ]),
    ownGoal: (s, m) => pick([`¡¡EN CONTRA DE ${s.toUpperCase()} EN EL ${m}'!! ¡¡MAMITA QUERIDA!!`, `¡¡AUTOGOL DE ${s.toUpperCase()}!! ¡¡NO LO PUEDO CREER SEÑORES!!`]),
    redCard: (p, m) => pick([`¡¡ROJA PARA ${p.toUpperCase()} EN EL ${m}'!! ¡¡SE VA SEÑORES!!`, `¡¡EXPULSADO ${p.toUpperCase()}!! ¡¡ESTO SE PONE PICANTE!!`, `¡¡${p.toUpperCase()} SE VA EN EL ${m}'!! ¡¡ROJA DIRECTA!! ¡¡INCREÍBLE!!`, `¡¡ROJAAAA!! ¡¡${p.toUpperCase()} AFUERA EN EL ${m}'!! ¡¡QUÉ LOCURA!!`]),
    yellowCard: (p, m) => pick([`¡AMARILLA PARA ${p.toUpperCase()} EN EL ${m}'! ¡OJO QUE LA PRÓXIMA SE VA!`, `¡${p.toUpperCase()} AMONESTADO EN EL ${m}'! ¡TIENE QUE CUIDARSE!`, `¡TARJETA PARA ${p.toUpperCase()}! ¡MINUTO ${m}! ¡CUIDADO!`]),
    penalty: (s, m) => pick([`¡¡PENAL DE ${s.toUpperCase()} EN EL ${m}'!! ¡¡SEÑOOOORES!!`, `¡¡PENAAAAL!! ¡¡${s.toUpperCase()} EN EL ${m}'!! ¡¡ESTO ES DRAMÁTICO!!`]),
    scoreless: (m) => pick([`¡¡${m} MINUTOS Y NO HAY GOLES SEÑORES!!`, `¡¡ESTO NO SE ABRE!! ¡¡INCREÍBLE!!`, `¡¡0-0 AL MINUTO ${m}!! ¡¡CUÁNDO VA A ENTRAR UNA!!`, `¡¡SEGUIMOS SIN GOLES SEÑORES!! ¡¡${m} MINUTOS YA!!`]),
    lateGame: (h, a) => pick([`¡¡ÚLTIMOS MINUTOS!! ¡¡${h}-${a}!! ¡¡SE DEFINE SEÑORES!!`, `¡¡QUEDA NADA!! ¡¡${h}-${a}!! ¡¡ESTO ES AHORA O NUNCA!!`, `¡¡FINAL DEL PARTIDO!! ¡¡${h}-${a}!! ¡¡QUÉ TENSIÓN SEÑORES!!`]),
    comodinWinning: (n, h, a) => pick([`¡¡${n.toUpperCase()} CON EL COMODÍN Y VA ${h}-${a}!! ¡¡QUÉ GENIO!!`, `¡¡${n.toUpperCase()} SE FROTA LAS MANOS SEÑORES!!`, `¡¡EL COMODÍN DE ${n.toUpperCase()} BRILLA CON ESTE ${h}-${a}!!`]),
    comodinLosing: (n, h, a) => pick([`¡¡EL COMODÍN DE ${n.toUpperCase()} LLORA CON ESTE ${h}-${a}!!`, `¡¡${n.toUpperCase()} LA ESTÁ PASANDO MAL!!`, `¡¡${n.toUpperCase()} SUFRE SEÑORES!! ¡¡${h}-${a} Y EL COMODÍN TIEMBLA!!`]),
    comodinExactHit: (n, h, a) => pick([`¡¡${n.toUpperCase()} CLAVÓ EL ${h}-${a}!! ¡¡INCREÍBLE SEÑORES!!`, `¡¡${n.toUpperCase()} ACERTÓ EL EXACTO!! ¡¡${h}-${a}!! ¡¡ES ADIVINO!!`]),
    nobodyRight: () => pick(["¡¡CASI NADIE LE PEGÓ SEÑORES!! ¡¡QUÉ PARTIDO!!", "¡¡NADIE LO VIO VENIR!! ¡¡ESTO ES FÚTBOL SEÑORES!!"]),
    fewRight: (names) => pick([`¡¡SOLO ${names.toUpperCase()} LE ESTÁN PEGANDO!! ¡¡EL RESTO A LLORAR!!`, `¡¡${names.toUpperCase()} NADA MÁS ACIERTAN!! ¡¡QUÉ BÁRBARO!!`]),
    idle: () => pick([
      "¡Acá estamos señores!",
      "¡ESTO SE PONE LINDO!",
      "¡Atención que puede pasar de todo!",
      "¡EL ESTADIO ESTÁ QUE EXPLOTA SEÑORES!",
      "¡QUÉ CLIMA EN LA CANCHA! ¡SE SIENTE!",
      "¡La pelota va y viene señores, esto no para!",
      "¡Yo les dije que iba a ser un partidazo!",
      "¡Esto es fútbol señores, ESTO ES FÚTBOL!",
      "¡Qué lindo es el mundial cuando se juega así!",
      "¡NO SE MUEVAN SEÑORES QUE ESTO SE PONE BUENO!",
    ]),
    taunt: (n) => pick([
      `¡¡${n.toUpperCase()} ESTÁ SUFRIENDO SEÑORES!!`,
      `¡¡MIRÁ LA CARA DE ${n.toUpperCase()}!!`,
      `¡¡${n.toUpperCase()} NO LO PUEDE CREER!!`,
      `¡¡${n.toUpperCase()} TRANSPIRA SEÑORES!! ¡¡SE LE COMPLICA!!`,
      `¡¡QUÉ SERÁ DE ${n.toUpperCase()} DESPUÉS DE ESTE PARTIDO!!`,
    ]),
    rankingTaunt: (n, pos, diff) => {
      if (diff > 0) return `¡¡${n.toUpperCase()} SUBIÓ ${diff} PUESTO${diff > 1 ? "S" : ""} SEÑORES!! ¡¡CÓMO TREPA!!`;
      if (diff < 0) return `¡¡${n.toUpperCase()} CAYÓ ${Math.abs(diff)} PUESTO${Math.abs(diff) > 1 ? "S" : ""}!! ¡¡QUÉ GOLPE!!`;
      if (pos === 1) return `¡¡${n.toUpperCase()} VA PRIMERO SEÑORES!! ¡¡NADIE LO PARA!!`;
      if (pos <= 3) return `¡¡${n.toUpperCase()} VA ${pos}°!! ¡¡SE METE EN EL PODIO!!`;
      return `¡¡${n.toUpperCase()} VA ${pos}°!! ¡¡TIENE QUE REACCIONAR SEÑORES!!`;
    },
  },
  "fecha-3": { // Trump
    goal: (s, m, _side, h, a) => pick([
      `Goal by ${s}, minute ${m}. ${h}-${a}. Tremendous goal, believe me!`,
      `${s} scored! ${h}-${a}! Almost as good as my goals, amigo`,
      `¡Gol de ${s} en el ${m}'! ${h}-${a}. I predicted this, nobody predicts like me`,
      `${s}, minute ${m}! ${h}-${a}! This is YUGE, absolutamente yuge!`,
      `${h}-${a}! ${s} scored in the ${m}'! Great player, almost as great as me`,
      `¡GOOOL! ${s} in the ${m}'! ${h}-${a}! I would have scored sooner, believe me`,
      `${s} just made this game great again! ${h}-${a}, minute ${m}!`,
      `Tremendous! ${s} scores! ${h}-${a}! ¡Qué golazo, amigos!`,
    ]),
    ownGoal: (s, m) => pick([`Own goal by ${s} in minute ${m}? ¡Qué desastre! You're fired, ${s}!`, `${s} scored on himself in the ${m}'! Sad! Very sad, muy triste!`]),
    redCard: (p, m) => pick([`Red card for ${p} in minute ${m}! You're fired!`, `${p} expelled! Sad! Very unfair!`, `${p} got red in the ${m}'! I would have deported him, not just expelled`, `¡Roja para ${p}! Minute ${m}! Bye bye amigo!`]),
    yellowCard: (p, m) => pick([`Yellow card for ${p}, minute ${m}. I would have given red, believe me`, `${p} with a yellow in the ${m}'. Weak call! Should be red!`, `Amarilla for ${p}! Minute ${m}! The ref is being too nice, muy blando`]),
    penalty: (s, m) => pick([`Penalty by ${s} in the ${m}'! ¡Penal, amigos!`, `¡PENAL! ${s} in the ${m}'! Nobody calls penalties better than me`]),
    scoreless: (m) => pick([`${m} minutes, 0-0? This is very boring, muy aburrido`, `Nobody is scoring! I could score faster, believe me`, `0-0 at minute ${m}? This is a disaster! Total disaster!`, `${m}' and still nothing! Even my wall went up faster than these goals`]),
    lateGame: (h, a) => pick([`Last minutes! ${h}-${a}. More dramatic than election night!`, `${h}-${a} and almost over! This is tremendous, señores!`, `Final minutes! ${h}-${a}! I love this tension, very exciting!`]),
    comodinWinning: (n, h, a) => pick([`${n} put the comodín and it's ${h}-${a}! Smart, very smart!`, `${n} is making Produsa great again!`, `${n} with the comodín winning at ${h}-${a}! Almost as smart as me`]),
    comodinLosing: (n, h, a) => pick([`${n} put the comodín here with ${h}-${a}? Bad decision! Sad!`, `The comodín of ${n} is crying. Very sad, muy triste`, `${n}'s comodín at ${h}-${a}... terrible decision, the worst!`]),
    comodinExactHit: (n, h, a) => pick([`${n} nailed ${h}-${a}! Almost as smart as me, believe me!`, `${n} got the exact ${h}-${a}! Tremendous prediction! ¡Genio!`]),
    nobodyRight: () => pick(["Nobody predicted this! Not even Trump, and I'm the best predictor", "Nadie le pegó! This game is unpredictable, like me!"]),
    fewRight: (names) => pick([`Only ${names} got it right. The rest? You're fired!`, `${names} nailed it! Everyone else is a loser, believe me`]),
    idle: () => pick([
      "I'm watching the best game ever, believe me",
      "¡Esto se pone bueno, amigos!",
      "Nobody watches games better than me",
      "This stadium is tremendous, almost as big as my buildings",
      "I've seen better games, but this one is ok, muy bueno",
      "¡La cancha está llena! Like my rallies, believe me",
      "If I was coaching, we'd be winning 10-0. Believe me",
      "This referee is very unfair. Reminds me of the media",
      "I would have made both teams great again",
      "¡Qué partido, amigos! Almost as exciting as my deals",
    ]),
    taunt: (n) => pick([
      `${n}, bad prediction. Very bad! You're fired, amigo`,
      `I've seen better predictions from ${n}... actually no, they're always bad`,
      `${n} is sweating right now. Sad! Muy triste`,
      `${n}, nobody predicts worse than you. Believe me`,
      `${n} needs to make their predictions great again`,
    ]),
    rankingTaunt: (n, pos, diff) => {
      if (diff > 0) return `${n} climbed ${diff} spot${diff > 1 ? "s" : ""}! Smart, very smart!`;
      if (diff < 0) return `${n} dropped ${Math.abs(diff)} spot${Math.abs(diff) > 1 ? "s" : ""}. Sad! Very sad!`;
      if (pos === 1) return `${n} is first! Almost as good as me, believe me`;
      if (pos <= 3) return `${n} is ${pos}th. Not bad, amigo. Not bad at all`;
      return `${n} is ${pos}th. I would be first, believe me`;
    },
  },
  "R32": { // Albertito
    goal: (s, m, _side, h, a) => pick([
      `Gol de ${s} en el ${m}'. ${h}-${a}. Yo me enteré por zoom`,
      `¡${s} la metió! ${h}-${a}. Guardo conmigo el dolor o la alegría, no sé cuál`,
      `${s}, minuto ${m}. ${h}-${a}. La culpa de este resultado es de Macri`,
      `¡Gol! ${s} en el ${m}'. Esto es como mi gestión: impredecible`,
      `${h}-${a}. ${s} en el ${m}'. Me lo avisaron por WhatsApp desde Olivos`,
      `¡${s} convirtió! ${h}-${a}. Yo hubiera metido el gol de otra manera`,
      `Gol en el ${m}', ${s}. ${h}-${a}. Esto no estaba en el plan de gobierno`,
      `¡${h}-${a}! ${s} en el ${m}'. Fabiola me dijo que iba a pasar`,
    ]),
    ownGoal: (s, m) => pick([`En contra de ${s} en el ${m}'. Más autogol que mi candidatura`, `Autogol de ${s} en el ${m}'. Peor que mis declaraciones en cadena nacional`]),
    redCard: (p, m) => pick([`Roja para ${p} en el ${m}'. Se va más rápido que yo de Olivos`, `${p} expulsado. Como yo del poder, pero más dignamente`, `${p} se fue en el ${m}'. Lo echaron mejor que a mí`, `Roja para ${p} en el ${m}'. Se va como Guzmán del ministerio`]),
    yellowCard: (p, m) => pick([`Amarilla para ${p} en el ${m}'. Le pasa por no escuchar a Cristina`, `${p} amonestado. Todavía no lo echaron, le va mejor que a mí`, `${p} con amarilla en el ${m}'. Yo le hubiera dado un cargo en vez de una tarjeta`, `Amarilla para ${p}. Minuto ${m}. Se la dedico a Macri`]),
    penalty: (s, m) => pick([`¡Penal de ${s} en el ${m}'! Más polémico que la fiesta de Olivos`, `¡Penal! ${s} en el ${m}'. Más cuestionable que mi gestión`]),
    scoreless: (m) => pick([`${m} minutos y 0-0... esto está más trabado que la economía que dejé`, `¿No piensan meter un gol? Esto es peor que mi gestión`, `0-0 al minuto ${m}. Más vacío que las arcas del Estado`, `${m}' sin goles. Heredamos un partido sin goles y no lo pudimos resolver`]),
    lateGame: (h, a) => pick([`Últimos minutos, ${h}-${a}. Como los últimos meses en Olivos`, `Se termina esto. ${h}-${a}. Como mi mandato, con más pena que gloria`, `${h}-${a} y queda nada. Guardo conmigo el dolor de estos últimos minutos`, `Final del partido con ${h}-${a}. Yo me voy a Disney`]),
    comodinWinning: (n, h, a) => pick([`${n} puso el comodín y va ${h}-${a}... yo nunca tuve esa suerte`, `¡${n} con el +2! Ojalá yo hubiera tenido esos puntos de aprobación`, `${n} va ganando con el comodín. Mejor gestión que la mía`]),
    comodinLosing: (n, h, a) => pick([`${n} puso el comodín con el ${h}-${a}... F. Como mi legado`, `El comodín de ${n} llora como el presupuesto nacional`, `${n} sufre con el comodín y el ${h}-${a}. Bienvenido a mi mundo`]),
    comodinExactHit: (n, h, a) => pick([`¡${n} CLAVÓ el ${h}-${a}! Más preciso que mis encuestas falsas`, `¡${n} acertó el ${h}-${a}! Le ofrezco un puesto... ah no, ya no tengo`]),
    nobodyRight: () => pick(["¡Nadie le pegó! Como nadie le pegó a mis predicciones económicas", "Nadie acertó. Como nadie acertó votándome a mí"]),
    fewRight: (names) => pick([`Solo ${names} le están pegando. Los demás están como mi gabinete: perdidos`, `${names} nada más aciertan. El resto predice como yo gobernaba`]),
    idle: () => pick([
      "Ahí veo al compañero de Garganta Profun... Poderosa, Poderosa...",
      "Lo que hay que veeeeer es la producción de Sandra",
      "Decime algo lindooooo",
      "Heredamos este partido y lo estamos reconstruyendo",
      "Alberto Fernández nunca se enamoró de este partido",
      "Esto me lo informan por zoom desde Balcarce 50",
      "Prefiero un 0-0 y no 100.000 goles en contra",
      "Este partido lo manejo yo... bueno, en realidad no manejo nada",
      "La cancha está bien, la economía no, pero la cancha está bien",
      "Me da vergüenza que en la Argentina se juegue así",
      "Esto es como gobernar: nunca sabés qué va a pasar",
      "El árbitro cobra como mis ministros: mal y caro",
      "Fabiola me dijo que iba a ser un buen partido... y mirá",
      "Algunos miserables dijeron que iba a ser aburrido... y tenían razón",
      "Yo le pregunté a Cristina quién iba a ganar pero no me habla",
      "Si esto sale mal, la culpa es de Macri",
      "De este partido no se vuelve, de la economía tampoco",
      "Los mexicanos salieron de los indios, los brasileros de la selva, y estos de dónde salieron",
      "Estoy muy feliz de estar poniéndole el fin al aburrimiento",
      "Yo a este partido lo hubiera ganado de otra manera",
    ]),
    taunt: (n) => pick([
      `${n}, esa predicción es peor que mi gestión económica`,
      `${n} transpira más que yo en conferencia de prensa`,
      `Le voy a echar la culpa a ${n} si sale mal esto`,
      `${n}, te recomiendo irte a Disney como hice yo`,
      `${n} predice como yo gobernaba: con esperanza y sin datos`,
      `A ${n} le digo: guardo conmigo el dolor de tu predicción`,
    ]),
    rankingTaunt: (n, pos, diff) => {
      if (diff > 0) return `${n} subió ${diff} puesto${diff > 1 ? "s" : ""}. Yo nunca subí en las encuestas`;
      if (diff < 0) return `${n} cayó ${Math.abs(diff)} puesto${Math.abs(diff) > 1 ? "s" : ""}. Como mi imagen pública`;
      if (pos === 1) return `${n} va primero. Ojalá yo hubiera tenido esos números de aprobación`;
      if (pos <= 3) return `${n} va ${pos}°, mejor ubicado que yo en la historia`;
      return pick([`${n} va ${pos}°. Como yo en el ranking de presidentes`, `${n} en el puesto ${pos}... la culpa es de Macri`]);
    },
  },
};

function generateDynamicPhrase(
  score: LiveScore,
  preds: ComodinPred[],
  scope: string,
  lastEventIndex: number,
  ranking?: RankingSnapshotEntry[],
): { phrase: string; newEventIndex: number } {
  const voice = VOICES[scope] ?? VOICES["fecha-1"];
  const h = score.homeScore;
  const a = score.awayScore;
  const min = score.minute;
  const hasScore = h >= 0 && a >= 0;
  const events = score.events ?? [];
  const comodinUsers = preds.filter((p) => p.isComodin);

  // Priority 1: React to new events we haven't commented on yet
  if (events.length > lastEventIndex) {
    const event = events[lastEventIndex];
    const newIdx = lastEventIndex + 1;
    if (event.type === "goal") {
      const detail = event.detail;
      if (detail === "Own Goal") return { phrase: voice.ownGoal(event.player, event.minute), newEventIndex: newIdx };
      if (detail === "Penalty") return { phrase: voice.penalty(event.player, event.minute), newEventIndex: newIdx };
      return { phrase: voice.goal(event.player, event.minute, event.side, h, a), newEventIndex: newIdx };
    }
    if (event.type === "red") return { phrase: voice.redCard(event.player, event.minute), newEventIndex: newIdx };
    if (event.type === "yellow") return { phrase: voice.yellowCard(event.player, event.minute), newEventIndex: newIdx };
  }

  if (!hasScore) return { phrase: voice.idle(), newEventIndex: lastEventIndex };

  // Priority 2: Comodin user reactions
  if (comodinUsers.length > 0 && Math.random() < 0.4) {
    const p = pick(comodinUsers);
    const predictedL = p.outcome === "L";
    const winning = predictedL ? h > a : a > h;
    const losing = predictedL ? a > h : h > a;

    if (p.exactHome !== null && p.exactAway !== null && p.exactHome === h && p.exactAway === a) {
      return { phrase: voice.comodinExactHit(p.name, h, a), newEventIndex: lastEventIndex };
    }
    if (winning) return { phrase: voice.comodinWinning(p.name, h, a), newEventIndex: lastEventIndex };
    if (losing) return { phrase: voice.comodinLosing(p.name, h, a), newEventIndex: lastEventIndex };
  }

  // Priority 3: General prediction commentary
  if (Math.random() < 0.3 && preds.length > 3) {
    const actual = h > a ? "L" : a > h ? "V" : "E";
    const wrong = preds.filter((p) => p.outcome && !p.outcome.includes(actual));
    if (wrong.length > preds.length * 0.7) return { phrase: voice.nobodyRight(), newEventIndex: lastEventIndex };
    const right = preds.filter((p) => p.outcome && p.outcome.includes(actual));
    if (right.length <= 2 && right.length > 0) {
      return { phrase: voice.fewRight(right.map((p) => p.name).join(" y ")), newEventIndex: lastEventIndex };
    }
  }

  // Priority 4: Score/time commentary
  if (h === 0 && a === 0 && min > 30) return { phrase: voice.scoreless(min), newEventIndex: lastEventIndex };
  if (min > 80) return { phrase: voice.lateGame(h, a), newEventIndex: lastEventIndex };

  // Priority 5: Ranking commentary (25% chance)
  if (ranking && ranking.length > 0 && Math.random() < 0.25) {
    const target = pick(ranking);
    const diff = target.previousPosition - target.position;
    return { phrase: voice.rankingTaunt(target.name, target.position, diff), newEventIndex: lastEventIndex };
  }

  // Priority 6: Taunt a random player (30% chance)
  if (preds.length > 0 && Math.random() < 0.3) {
    const target = pick(preds);
    return { phrase: voice.taunt(target.name), newEventIndex: lastEventIndex };
  }

  // Priority 7: Idle chatter
  return { phrase: voice.idle(), newEventIndex: lastEventIndex };
}

function LiveComodinDock({ scope, matchId, liveScore, rankingSnapshot }: { scope: string; matchId: string; liveScore: LiveScore; rankingSnapshot?: RankingSnapshotEntry[] }) {
  const config = getComodinConfig(scope);
  const [phrase, setPhrase] = useState("");
  const [visible, setVisible] = useState(false);
  const [preds, setPreds] = useState<ComodinPred[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventIndexRef = useRef(0);

  // Clear phrase tracker on match change
  useEffect(() => {
    usedPhrases.clear();
  }, [matchId]);

  useEffect(() => {
    fetch(`/api/live-predictions?matchId=${matchId}`)
      .then((r) => r.ok ? r.json() : { predictions: [] })
      .then((data) => {
        setPreds((data.predictions ?? []).map((p: { user: { name: string }; outcome: string; exactScore: { home: number; away: number } | null; isComodin: boolean }) => ({
          name: p.user.name,
          outcome: p.outcome,
          exactHome: p.exactScore?.home ?? null,
          exactAway: p.exactScore?.away ?? null,
          isComodin: p.isComodin,
        })));
      })
      .catch(() => {});
  }, [matchId]);

  const liveScoreRef = useRef(liveScore);
  liveScoreRef.current = liveScore;
  const predsRef = useRef(preds);
  predsRef.current = preds;
  const rankingRef = useRef(rankingSnapshot);
  rankingRef.current = rankingSnapshot;

  const lastEventCount = useRef(0);
  const eventQueue = useRef<string[]>([]);
  const isShowingRef = useRef(false);

  useEffect(() => {
    const isDev = process.env.NODE_ENV === "development";
    const EVENT_VISIBLE_MS = isDev ? 4000 : 8000;
    const IDLE_VISIBLE_MS = isDev ? 5000 : 10000;
    const EVENT_CHECK_MS = isDev ? 3000 : 15000;
    const IDLE_INTERVAL_MS = isDev ? 8000 + Math.random() * 4000 : 25000 + Math.random() * 10000;

    function showPhrase(text: string, durationMs: number) {
      isShowingRef.current = true;
      setPhrase(text);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        isShowingRef.current = false;
        // Drain queue if more events waiting
        if (eventQueue.current.length > 0) {
          const next = eventQueue.current.shift()!;
          setTimeout(() => showPhrase(next, EVENT_VISIBLE_MS), 1500);
        }
      }, durationMs);
    }

    function checkEvents() {
      const events = liveScoreRef.current.events ?? [];
      // Generate phrases for ALL new events
      while (events.length > lastEventCount.current) {
        const result = generateDynamicPhrase(liveScoreRef.current, predsRef.current, scope, eventIndexRef.current, rankingRef.current);
        eventIndexRef.current = result.newEventIndex;
        lastEventCount.current = Math.max(lastEventCount.current + 1, result.newEventIndex);
        eventQueue.current.push(result.phrase);
      }
      // Show first queued event if not already showing
      if (!isShowingRef.current && eventQueue.current.length > 0) {
        const next = eventQueue.current.shift()!;
        showPhrase(next, EVENT_VISIBLE_MS);
      }
    }

    function showIdle() {
      if (isShowingRef.current || eventQueue.current.length > 0) return;
      const result = generateDynamicPhrase(liveScoreRef.current, predsRef.current, scope, eventIndexRef.current, rankingRef.current);
      eventIndexRef.current = result.newEventIndex;
      showPhrase(result.phrase, IDLE_VISIBLE_MS);
    }

    const eventInterval = setInterval(checkEvents, EVENT_CHECK_MS);
    const idleInterval = setInterval(showIdle, IDLE_INTERVAL_MS);
    timerRef.current = setTimeout(showIdle, 5000);

    return () => {
      clearInterval(eventInterval);
      clearInterval(idleInterval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scope]);

  if (!config.name) return null;

  return (
    <div className="absolute bottom-3 right-3 flex items-end gap-2 z-10">
      {visible && phrase && (
        <div className="max-w-[180px] animate-[fadeInUp_0.3s_ease-out]">
          <div className="relative rounded-xl bg-black/50 backdrop-blur-sm px-2.5 py-1.5 ring-1 ring-fifa-gold/30">
            <p className="text-[9px] text-fifa-gold italic leading-tight">
              &ldquo;{phrase}&rdquo;
            </p>
            <div className="absolute -right-1 bottom-2 h-2 w-2 rotate-45 bg-black/50 ring-1 ring-fifa-gold/30" style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }} />
          </div>
        </div>
      )}
      <div className="relative h-9 w-9 flex-shrink-0 rounded-full overflow-hidden ring-2 ring-fifa-gold shadow-lg shadow-fifa-gold/30">
        <Image src={config.image} alt={config.name} fill className="object-cover" />
      </div>
    </div>
  );
}

interface RankingSnapshotEntry {
  name: string;
  position: number;
  previousPosition: number;
  totalPoints: number;
}

interface LiveScoreboardProps {
  match: UnifiedMatch;
  liveScore: LiveScore;
  stale?: boolean;
  rankingSnapshot?: RankingSnapshotEntry[];
}

export function LiveScoreboard({ match, liveScore, stale = false, rankingSnapshot }: LiveScoreboardProps) {
  const home = match.homeTeamId ? getTeam(match.homeTeamId) : null;
  const away = match.awayTeamId ? getTeam(match.awayTeamId) : null;
  const hasScore = liveScore.homeScore >= 0 && liveScore.awayScore >= 0;
  const status = liveScore.status;
  const events = liveScore.events ?? [];

  const statusLabels: Record<string, string> = {
    HT: "Entretiempo",
    ET: "Tiempo extra",
    P: "Penales",
    BT: "Entretiempo",
  };

  return (
    <div className="relative">
    <div className="rounded-3xl bg-gradient-to-br from-fifa-purple via-fifa-blue to-fifa-teal p-6 text-white shadow-xl shadow-fifa-purple/20 overflow-hidden">

      <div className="relative">
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fifa-red opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-fifa-red" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
            {!hasScore
              ? "En vivo · Esperando datos"
              : status && statusLabels[status]
                ? `En vivo · ${statusLabels[status]}`
                : stale
                  ? `En vivo · ${liveScore.minute}' (última actualización)`
                  : liveScore.extra
                    ? `En vivo · ${liveScore.minute}+${liveScore.extra}'`
                    : `En vivo · ${liveScore.minute}'`}
          </span>
        </div>

        <div className="flex min-w-0 items-start justify-between">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2">
            {home ? (
              <>
                <FlagImage code={home.flagCode} name={home.name} size="lg" />
                <span className="font-display text-base tracking-wider sm:text-xl">{home.shortName}</span>
              </>
            ) : (
              <span className="text-sm text-white/50">{match.homeLabel}</span>
            )}
            {events.length > 0 && (
              <div className="mt-1 w-full px-0.5 sm:px-1">
                <LiveEventTimeline events={events} side="home" />
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 px-1 pt-3 sm:gap-4 sm:px-4" aria-live="polite" aria-atomic="true">
            <span className="font-display text-4xl leading-none sm:text-7xl">
              {hasScore ? liveScore.homeScore : "–"}
            </span>
            <span className="text-xl text-white/20 sm:text-3xl">:</span>
            <span className="font-display text-4xl leading-none sm:text-7xl">
              {hasScore ? liveScore.awayScore : "–"}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2">
            {away ? (
              <>
                <FlagImage code={away.flagCode} name={away.name} size="lg" />
                <span className="font-display text-base tracking-wider sm:text-xl">{away.shortName}</span>
              </>
            ) : (
              <span className="text-sm text-white/50">{match.awayLabel}</span>
            )}
            {events.length > 0 && (
              <div className="mt-1 w-full px-0.5 sm:px-1">
                <LiveEventTimeline events={events} side="away" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-center text-[11px] text-white/30">
          {match.venue}, {match.city}
        </div>

      </div>
    </div>
      <LiveComodinDock scope={match.scope} matchId={match.id} liveScore={liveScore} rankingSnapshot={rankingSnapshot} />
    </div>
  );
}
