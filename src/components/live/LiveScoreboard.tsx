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
  comodinDraw: (name: string, min: number) => string;
  comodinExactHit: (name: string, h: number, a: number) => string;
  nobodyRight: () => string;
  fewRight: (names: string) => string;
  idle: () => string;
  taunt: (name: string) => string;
  rankingTaunt: (name: string, pos: number, diff: number) => string;
  lecture?: Record<string, string[]>;
}

const usedPhrases = new Set<string>();
const usedLectures = new Set<string>();
const usedRanking = new Set<string>();
const usedTaunts = new Set<string>();
function pick<T>(arr: T[], trackSet?: Set<string>): T {
  if (arr.length <= 1) return arr[0];
  const tracker = trackSet ?? usedPhrases;
  const fresh = arr.filter((v) => !tracker.has(String(v)));
  const pool = fresh.length > 0 ? fresh : arr;
  if (fresh.length === 0) {
    for (const v of arr) tracker.delete(String(v));
  }
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  tracker.add(String(chosen));
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
    comodinDraw: (n, m) => pick([`${n} necesita un golcito urgente... minuto ${m} y empate`, `El comodín de ${n} pende de un hilo con este empate`]),
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
    comodinDraw: (n, m) => pick([`¡¡${n.toUpperCase()} NECESITA UN GOL URGENTE!! ¡¡MINUTO ${m} Y EMPATE!!`, `¡¡EL COMODÍN DE ${n.toUpperCase()} TIEMBLA CON ESTE EMPATE!!`]),
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
    ownGoal: (s, m) => pick([`Own goal by ${s} in minute ${m}? ¡Qué desastre! You're fired, ${s}!`, `${s} scored on himself in the ${m}'! Sad! Very sad, muy triste!`, `${s} with an own goal in the ${m}'! Worse than my opponents, believe me`, `Autogol de ${s}! Minute ${m}! This is embarrassing, ¡vergonzoso!`, `${s} put it in his own net in the ${m}'! I never make mistakes like that`]),
    redCard: (p, m) => pick([`Red card for ${p} in minute ${m}! You're fired!`, `${p} expelled! Sad! Very unfair!`, `${p} got red in the ${m}'! I would have deported him, not just expelled`, `¡Roja para ${p}! Minute ${m}! Bye bye amigo!`, `${p} is OUT in the ${m}'! Nobody gets expelled better than ${p}`]),
    yellowCard: (p, m) => pick([`Yellow card for ${p}, minute ${m}. I would have given red, believe me`, `${p} with a yellow in the ${m}'. Weak call! Should be red!`, `Amarilla for ${p}! Minute ${m}! The ref is being too nice, muy blando`, `${p} amonestado in the ${m}'. In my country that's a deportation`, `Yellow for ${p}! Minute ${m}! I've seen worse, believe me`]),
    penalty: (s, m) => pick([`Penalty by ${s} in the ${m}'! ¡Penal, amigos!`, `¡PENAL! ${s} in the ${m}'! Nobody calls penalties better than me`, `${s} with a penalty in the ${m}'! This is YUGE! Tremendously dramatic!`, `Penalty! ${s}, minute ${m}! I would have scored it already, believe me`, `¡Penal de ${s}! Minute ${m}! More dramatic than my impeachment trials!`]),
    scoreless: (m) => pick([`${m} minutes, 0-0? This is very boring, muy aburrido`, `Nobody is scoring! I could score faster, believe me`, `0-0 at minute ${m}? This is a disaster! Total disaster!`, `${m}' and still nothing! Even my wall went up faster than these goals`, `Minute ${m} and 0-0! This game needs to be made great again!`]),
    lateGame: (h, a) => pick([`Last minutes! ${h}-${a}. More dramatic than election night!`, `${h}-${a} and almost over! This is tremendous, señores!`, `Final minutes! ${h}-${a}! I love this tension, very exciting!`, `${h}-${a} in the final stretch! Nobody does drama like this, except me`, `¡Se termina! ${h}-${a}! This ending is better than my TV show!`]),
    comodinWinning: (n, h, a) => pick([`${n} put the comodín and it's ${h}-${a}! Smart, very smart!`, `${n} is making Produsa great again!`, `${n} with the comodín winning at ${h}-${a}! Almost as smart as me`, `${n} and the comodín at ${h}-${a}! Tremendous decision, amigo!`, `${n} va ganando con el comodín! ${h}-${a}! I approve, believe me`]),
    comodinLosing: (n, h, a) => pick([`${n} put the comodín here with ${h}-${a}? Bad decision! Sad!`, `The comodín of ${n} is crying. Very sad, muy triste`, `${n}'s comodín at ${h}-${a}... terrible decision, the worst!`, `${n} losing with the comodín at ${h}-${a}! Should have asked Trump first`, `El comodín de ${n} suffers with ${h}-${a}! Bad, very bad!`]),
    comodinDraw: (n, m) => pick([`${n} needs a goal NOW! Minute ${m} and it's tied! Come on, amigo!`, `${n}'s comodín is in trouble with this draw! Sad!`, `Empate en el ${m}' and ${n}'s comodín is nervous! Very nervous!`, `${n} con el comodín and it's tied! Minute ${m}! Somebody score, por favor!`, `${n} needs action! Minute ${m}, still tied! This is terrible for the comodín!`]),
    comodinExactHit: (n, h, a) => pick([`${n} nailed ${h}-${a}! Almost as smart as me, believe me!`, `${n} got the exact ${h}-${a}! Tremendous prediction! ¡Genio!`, `${n} predicted ${h}-${a} exactly! Nobody predicts like ${n}... except me`, `¡${n} clavó el ${h}-${a}! Genius! I taught them everything, believe me`, `Exact score by ${n}! ${h}-${a}! This is the art of the prediction!`]),
    nobodyRight: () => pick(["Nobody predicted this! Not even Trump, and I'm the best predictor", "Nadie le pegó! This game is unpredictable, like me!", "Zero correct predictions! This is a total disaster for everyone!", "Nobody got it right! Even I'm surprised, and I'm never surprised!", "Not a single prediction correct! You're all fired!"]),
    fewRight: (names) => pick([`Only ${names} got it right. The rest? You're fired!`, `${names} nailed it! Everyone else is a loser, believe me`, `Solo ${names} aciertan! The rest should learn from them... or from me`, `${names} are the winners! Everyone else? Sad!`, `Only ${names} are smart here. The rest need to make their predictions great again`]),
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
      `¡${s} la metió! ${h}-${a}. Guardo conmigo el dolor o la alegría, no sé cuál`,
      `${s}, minuto ${m}. ${h}-${a}. La culpa de este resultado es de Macri`,
      `¡Gol! ${s} en el ${m}'. Esto es como mi gestión: impredecible`,
      `¡${s} convirtió! ${h}-${a}. Yo hubiera metido el gol de otra manera`,
      `¡${h}-${a}! ${s} en el ${m}'. Fabiola me dijo que iba a pasar`,
    ]),
    ownGoal: (s, m) => pick([`En contra de ${s} en el ${m}'. Más autogol que mi candidatura`, `Autogol de ${s} en el ${m}'. Peor que mis declaraciones en cadena nacional`, `En contra en el ${m}'. ${s} se mandó una macana peor que la fiesta de Olivos`, `¡Autogol de ${s}! Minuto ${m}. Esto es culpa de Macri, seguro`]),
    redCard: (p, m) => pick([`La violencia de ${p} me asusta, así como lo hace Milei. Yo siempre fui un hombre de caricias.`, `Roja para ${p} en el ${m}'. Se va más rápido que yo de Olivos`, `${p} expulsado. Como yo del poder, pero más dignamente`, `${p} se fue en el ${m}'. Lo echaron mejor que a mí`, `Roja para ${p} en el ${m}'. Se va como Guzmán del ministerio`, `${p} afuera en el ${m}'. Duró más que algunos de mis ministros`]),
    yellowCard: (p, m) => pick([`Amarilla para ${p} en el ${m}'. Le pasa por no escuchar a Cristina`, `${p} amonestado. Todavía no lo echaron, le va mejor que a mí`, `${p} con amarilla en el ${m}'. Yo le hubiera dado un cargo en vez de una tarjeta`, `${p} amonestado en el ${m}'. Guardo conmigo el dolor de esta tarjeta`]),
    penalty: (s, m) => pick([`¡Penal de ${s} en el ${m}'! Más polémico que la fiesta de Olivos`, `¡Penal! ${s} en el ${m}'. Más cuestionable que mi gestión`, `¡${s} con penal! Minuto ${m}. Más drama que mi relación con Cristina`, `¡Penal de ${s} en el ${m}'! La culpa de todo esto es de Macri`]),
    scoreless: (m) => pick([`${m} minutos y 0-0... esto está más trabado que la economía que dejé`, `Es una mierda de partido, seguro lo produjo Sandra.`, `0-0 al minuto ${m}. Más vacío que el poder que me dejó Sergio al final de mi mandato.`, `${m}' sin goles. Heredamos un partido sin goles y no lo pudimos resolver`, `Minuto ${m} y 0-0. Pepe Mujica debe estar torrando.`]),
    lateGame: (h, a) => pick([`Últimos minutos, ${h}-${a}. Como los últimos meses en Olivos`, `Se termina esto. ${h}-${a}. Como mi mandato, con más pena que gloria`, `${h}-${a} y queda nada. Guardo conmigo el dolor de estos últimos minutos`, `Final del partido con ${h}-${a}. Yo me voy a Olivos a ver Netflix`, `${h}-${a} en el cierre. Más suspenso que la noche de las elecciones del 2023`]),
    comodinWinning: (n, h, a) => pick([`${n} puso el comodín y va ${h}-${a}... yo nunca tuve esa suerte`, `¡${n} con el +2! Ojalá yo hubiera tenido esos puntos de aprobación`, `${n} va ganando con el comodín. Mejor gestión que la mía`, `${n} y el comodín contentos con el ${h}-${a}. A mí nunca me festejaron así`, `El comodín de ${n} rinde con este ${h}-${a}. Más efectivo que mi plan económico`]),
    comodinLosing: (n, h, a) => pick([`${n} no le está pegando al comodín. Yo nunca le pegué a mi querida Fabiola.`, `${n} puso el comodín con el ${h}-${a}... Está muerto. Como mi legado`, `El comodín de ${n} llora como el presupuesto nacional`, `${n} sufre con el comodín y el ${h}-${a}. Bienvenido a mi mundo`, `${n} pierde con el comodín. ${h}-${a}. Más triste que mi despedida de Olivos`, `El comodín de ${n} con el ${h}-${a}... esto es culpa de Macri`]),
    comodinDraw: (n, m) => pick([`${n} necesita un golcito... minuto ${m} y empate. Como yo necesitaba un milagro económico`, `El comodín de ${n} tiembla con este empate. Guardo conmigo el dolor`, `${n} empata en el ${m}' con el comodín. Más angustia que esperar los datos del INDEC`, `Empate y el comodín de ${n} transpira. Minuto ${m}. Esto es como mi gestión: mucho suspenso y poco resultado`]),
    comodinExactHit: (n, h, a) => pick([`¡${n} CLAVÓ el ${h}-${a}! Más preciso que mis encuestas falsas`, `¡${n} acertó el ${h}-${a}! Le ofrezco un puesto... ah no, ya no tengo`, `¡${n} le pegó justo al ${h}-${a}! Más certero que cualquier promesa de campaña mía`, `¡Exacto de ${n}! ${h}-${a}. Si yo hubiera sido así de preciso, todavía gobernaba`, `¡${n} clavó el ${h}-${a}! Alberto Fernández nunca se enamoró de este resultado pero ${n} sí`]),
    nobodyRight: () => pick(["¡Nadie le pegó! Como nadie le pegó a mis predicciones económicas", "Nadie acertó. Como nadie acertó votándome a mí", "Cero aciertos. Más fallido que mi plan contra la inflación", "Nadie predijo esto. Ni yo, y eso que lo miraba por zoom", "¡Nadie le pegó! Esto es como mis promesas de campaña: nadie las creyó tampoco"]),
    fewRight: (names) => pick([`Solo ${names} le están pegando. Los demás están como mi gabinete: perdidos`, `${names} nada más aciertan. El resto predice como yo gobernaba`, `Únicamente ${names} aciertan. El resto heredó mis genes de predicción`, `Solo ${names} le pegan. Los demás necesitan un zoom con Cristina para mejorar`]),
    idle: () => pick([
      "Ahí veo al compañero de Garganta Profun... Poderosa, Poderosa, Poderosa, Poderosa...",
      "Lo que hay que veeeeer es la producción de Sandra",
      "Decime algo lindooooo",
      "¿Me amás?",
      "No hay ningún tipo penal que diga \"Será castigado el que vacuna a otro que se adelantó en la fila\"",
      "Heredamos este partido y lo estamos reconstruyendo",
      "Alberto Fernández nunca se enamoró de este partido",
      "Prefiero un 0-0 y no 100.000 goles en contra, como el modelo Sueco.",
      "Este partido lo manejo yo... bueno, en realidad no manejo nada",
      "Me gustaría que Robert De Niro me interprete en una película.",
      "Me da vergüenza que en el mundial se juegue así",
      "Esto es como gobernar: nunca sabés qué va a pasar",
      "Yo le pregunté a Cristina quién iba a ganar pero no me habla",
      "Si esto sale mal, la culpa es de Macri",
      "De este partido no se vuelve, de la economía tampoco",
      "Estoy muy feliz de estar poniéndole el fin al aburrimiento",
      "Yo a este partido lo hubiera ganado de otra manera",
      "No es lo mismo ser hincha de un club grande que de un club chico. Los grandes están en otra dimensión, es como ser hincha de una multinacional. Los chicos somos hinchas de una PyME, nos cuesta todo más trabajo",
      "Lo que siento por Argentinos es irracional, muy emotivo",
      "No tengo ninguna duda de que el mejor Maradona fue el que jugó en Argentinos Juniors. A Maradona le ponías diez escobas al lado y te hacía ganar",
      "Siempre le digo a los hinchas de Boca que conocieron el fútbol gracias a nosotros porque le dimos primero a Maradona y después a Riquelme",
      "Toda mi familia era de Boca y querían que yo fuera de Boca. Pero estudié a media cuadra de la cancha de Argentinos",
      "A los hinchas de Argentinos nos gusta jugar bien. Soy moderadamente puteador como hincha, por decirlo de algún modo",
      "Serrat me dijo que se enamoró de la historia de Argentinos. Es el equipo más romántico, tenemos la camiseta colorada porque eran anarquistas los fundadores",
      "Argentinos antes se llamaba Los Mártires de Chicago. Ese concepto es el que siempre nos llevó a jugar bien al fútbol",
      "El partido que hizo Borghi contra la Juventus es inolvidable. El premio se lo dieron a Platini, pero deberían habérselo dado a Borghi",
      "Cuando a nosotros nos dicen que hay un chico en la Quinta que es un fenómeno, ya lo estamos esperando. Mientras tanto River está pensando en cuándo vuelve Higuaín",
      "Lo que más quisiera es que el fútbol vuelva a recuperar el romanticismo de jugadores como Bochini que nació e hizo toda su carrera en Independiente",
      "Mi mejor lugar en la cancha es el arco. Y todavía sigo atajando... penales, crisis, lo que venga",
    ]),
    taunt: (n) => pick([
      `${n}, pronosticar no es tu fuerte. Está visto.`,
      `${n}, esa predicción es peor que mi gestión económica`,
      `${n}, mereces lo que te está pasando por haber votado a Milei.`,
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
    lecture: {
      RSA: ["¿Cuándo será el día en que el DT de Sudáfrica realmente se parezca a los sudafricanos? Como Evo y los bolivianos. Gran compañero, Evo.", "Yo que fui profesor en la UBA les cuento: Sudáfrica tiene 11 idiomas oficiales. Once. Yo con uno solo ya me metía en problemas", "Sudáfrica fue sede del Mundial 2010. El de la vuvuzela. Peor ruido que mis conferencias de prensa", "Mandela estuvo 27 años preso y después fue presidente. Yo fui presidente y ahora con la causa Seguros..."],
      CAN: ["Como les enseñaba a mis alumnos: Canadá tiene más lagos que todos los demás países juntos. Dato verificable, no como mis estadísticas del INDEC", "Los canadienses dicen 'sorry' por todo. Yo también debería, como les dije a mis alumnos"],
      BRA: ["Miren el rostro de Vini Jr. Yo siempre sostuve que los brasileños salieron de la selva.", "Les doy un dato que usaba en la facultad: Brasil es el único país que jugó todos los mundiales. Presencia perfecta. La mía en el Congreso era otra cosa", "Brasil con 5 mundiales es como ser hincha de una multinacional. Nosotros en Argentinos somos hinchas de una PyME. Todo nos cuesta"],
      JPN: ["En Japón los hinchas limpian el estadio después del partido. Si hicieran eso acá, el estadio estaría más limpio que mi expediente", "Dato de mi cátedra de derecho: en Japón hay más de 5 millones de máquinas expendedoras. Una cada 23 personas. Más accesibles que un ministro mío"],
      GER: ["Los alemanes tienen la Oktoberfest, yo la Olivosfest. No debió haberse hecho, Fabiola...", "Los alemanes son famosos por ser puntuales. Yo era puntual para las clases en la UBA, no para las reuniones de gabinete", "Los problemas de Alemania son diferentes a los de Argentinos Juniors. Ellos se preocupan por ganar mundiales, nosotros por no descender"],
      PAR: ["Como dijo el Profesor Alfaro, este partido es un parto de nalga.", "Los paraguayos vienen de la obras...en Devoto está repleto.", "Los guaraníes son uno de los pueblos originarios más orgullosos. Paraguay tiene dos idiomas oficiales: español y guaraní. Más bilingüe que mi doble discurso"],
      NED: ["Holanda está un tercio bajo el nivel del mar. Aun así no se hunden. A mi me hundió la pandemia, la sequía y Macri.", "Dato que daba en la UBA: Holanda es el mayor exportador de flores del mundo. Yo también repartía flores... a Cristina, para que no se enoje"],
      MAR: ["Por culpa de Marruecos no clasificó Escocia...qué ganas de un whisky", "Marruecos tiene el desierto del Sahara. Más seco que mi relación con Cristina al final del mandato"],
      CIV: ["Yo que estudié derecho y enseñé en la UBA les cuento: Costa de Marfil es el mayor productor de cacao del mundo. Sin ellos no hay chocolate", "Didier Drogba es el máximo goleador histórico de Costa de Marfil. Un crack. Lástima que no jugó para nosotros"],
      NOR: ["Noruega tiene el fondo soberano más grande del mundo. 1.4 billones de dólares. Nosotros teníamos... el ANSES", "Les cuento como profesor: Noruega tiene más fiordos que yo excusas para la inflación. Y miren que yo tenía muchas"],
      FRA: ["La Torre Eiffel iba a ser temporal. Como mi presidencia... bueno, esa sí fue temporal", "En mi cátedra siempre decía: los franceses consumen 25 mil toneladas de queso por año. Más agujeros que mi plan económico", "Francia tiene a Mbappé, nosotros en Argentinos tuvimos a Maradona. Las cuestiones que preocupan a los hinchas de Francia son diferentes a las nuestras"],
      SWE: ["Qué mal está manejando Suecia el partido, igual que con la pandemia.", "Suecia inventó IKEA. Yo también armé un gabinete con instrucciones confusas y sobraron piezas."],
      MEX: ["Se nota que los mexicanos salieron de los indios...", "Dato que enseño en clase: los mexicanos inventaron el chocolate caliente. Sin los aztecas no hay submarino"],
      ECU: ["Ecuador se llama así por la línea del ecuador que lo cruza. Dato que parece obvio pero mis alumnos de la UBA no lo sabían", "Las Islas Galápagos son de Ecuador. Darwin desarrolló su teoría ahí. Yo desarrollé mis teorías en Olivos, con menos éxito"],
      ENG: ["Yo que enseñé 20 años en la UBA les cuento: Inglaterra inventó el fútbol en 1863 pero solo ganó un mundial. En 1966. De local. Con un gol fantasma", "La Premier League es la liga más vista del mundo. Más audiencia que mis cadenas nacionales, seguro", "Los ingleses toman té a las 5. Nosotros tomamos mate todo el día. Somos más constantes", "Inglaterra tiene la Premier, los millones, los estadios. En Argentinos tenemos la cantera y el corazón. Somos una PyME con orgullo"],
      COD: ["El Congo tiene el río Congo, el más profundo del mundo. 220 metros. Más profunda que la crisis económica que heredamos...", "Dato de mi cátedra: la República Democrática del Congo es el país más grande de África subsahariana. Grande como mi sueño de ser recordado como buen presidente"],
      USA: ["¡Despertate, Donald! Ya lo hiciste con Macri, con Milei y ahora con Infantino.", "Este partido está intervenido por el FMI, lo lamento por los bosnios."],
      BIH: ["Bosnia tiene el puente de Mostar, reconstruido después de la guerra. Símbolo de reconciliación. Algo que yo con Cristina nunca logré", "En la UBA siempre hablaba de los Balcanes: el café bosnio se sirve en un džezva. Es como el café turco pero te lo explican con más historia"],
      BEL: ["Bélgica tiene más de 1.500 tipos de cerveza. Pero como la que me tomé con L-gante no hay.", "Esto se lo enseño a todos mis alumnos: los belgas inventaron las papas fritas. No los franceses. Nadie me cree", "Bélgica tiene 3 idiomas oficiales: francés, neerlandés y alemán. Un quilombo administrativo, pero menos que el nuestro"],
      SEN: ["Senegal ganó la Copa Africana en 2022. El mismo año que Argentina ganó el mundial. Buen año para el fútbol", "Les cuento como docente: el rally Dakar se llamaba así por la capital de Senegal, aunque ya no pasa por ahí. Como yo y la Rosada"],
      POR: ["Cristiano Ronaldo es portugués y tiene más de 900 goles. Más productivo que todo mi gabinete junto", "Dato que usaba en mis clases de la UBA: Portugal descubrió Brasil en 1500. Quinientos años después, Brasil los elimina en los mundiales. La historia tiene ironías", "Portugal tiene a Cristiano. Nosotros le dimos Maradona al mundo desde Argentinos. Las preocupaciones de los hinchas grandes son distintas a las nuestras"],
      CRO: ["Croacia tiene 4 millones de habitantes y fue finalista en 2018 y semifinalista en 2022. Per cápita, la mejor selección del mundo", "Les enseño algo: la corbata es invento croata. Cravat viene de 'croata'. Qué lindas son las croatas."],
      ESP: ["España ganó el mundial 2010 con el tiki-tiki. 800 pases por partido. Como mi querido Argentinos Juniors. Polo y Chekoloko no me van a dejar mentir.", "En mi cátedra siempre tiraba este dato: España tiene más bares per cápita que cualquier país europeo. Un verdadero paraíso.", "España con Barcelona y Real Madrid... nosotros tenemos a Argentinos Juniors. Es como comparar una multinacional con una PyME. Pero la PyME tiene más alma"],
      AUT: ["Como buen profesor les cuento: Austria nos dio a Mozart, Freud y el strudel. Tres contribuciones fundamentales a la humanidad", "Austria y Australia se confunden todo el tiempo. En Austria no hay canguros. En Australia no hay schnitzel... bueno, tal vez sí"],
      ARG: ["Muy a mi pesar, Argentina no saldrá campeón porque yo ya no soy presidente.", "45 millones de directores técnicos. Dato oficial. Yo que soy profesor de la UBA también opino de táctica pero nadie me pide consejo", "Les doy una clase gratis: Argentina es el octavo país más grande del mundo. En superficie. En problemas económicos somos top 3.", "Argentina tiene a Messi, pero el mejor Maradona fue el de Argentinos. Eso no se discute en La Paternal"],
      CPV: ["Dato para mis alumnos: Cabo Verde tiene 10 islas volcánicas. Medio millón de habitantes. Es la selección más chica de este mundial", "El morna, la música de Cabo Verde, es patrimonio de la humanidad. Cesária Évora la hizo famosa. Cultura, señores, cultura"],
      AUS: ["Australia tiene más canguros que personas. 50 millones contra 26 millones. Dato que siempre impresiona cuando lo doy en clase", "Dato de profesor: los australianos llaman 'football' al rugby y al fútbol le dicen 'soccer'. Un desastre lingüístico, como mi comunicación política"],
      EGY: ["Yo que enseñé derecho en la UBA les digo: Egipto tiene las pirámides que tienen 4.500 años. Más estables que la economía argentina. Mucho más", "Egipto tiene a Mohamed Salah y nosotros a Milagro Sala. Hemos sido beneficiados."],
      SUI: ["Suiza tiene más bancos que canchas de fútbol. Y más secretos bancarios que yo secretos de Estado...", "Los suizos son neutrales desde 1815. Yo intenté ser neutral entre Cristina y Macri y no me salió"],
      ALG: ["Dato que siempre doy en la facultad: Argelia es el país más grande de África. Más grande que la deuda externa... no, la deuda es más grande.", "Argelia ganó la Copa Africana en 2019 con Belmadi. Un técnico que sabe delegar. Yo no, yo quería hacer todo"],
      COL: ["Colombia tiene la biodiversidad de aves más grande del mundo. Más de 1.900 especies. Dato de National Geographic que uso en mis clases", "Les cuento como profesor: el café colombiano es de los mejores del mundo. Mucho mejor que el café del Congreso, que era horrible"],
      GHA: ["Dato de mi cátedra: Ghana fue el primer país de África subsahariana en independizarse, en 1957. Importante para el derecho internacional", "El 8 de Ghana se llama Sibo. Yo también tengo Sibo, pobre Fabiola."],
    },
  },
  "R16": { // El Profe Alfiki
    goal: (s, m, _side, h, a) => pick([
      `¡${s} en el ${m}'! ${h}-${a}. El gol es la consecuencia de la consecuencia. Lo trabajamos en la semana y la semana nos devolvió lo que le dimos`,
      `${s}, minuto ${m}. ${h}-${a}. Como decía Einstein, es más fácil desactivar un átomo que un preconcepto. Ese gol desactivó todo`,
      `¡Gol! ${h}-${a}. Fue una mezcla de sangre y utopía lo que permitió que esa pelota entre`,
      `¡${s} la metió! ${h}-${a}. El resultado te da la certeza, pero no te da la autoridad de sentirte dueño`,
      `${h}-${a}. ${s} en el ${m}'. A la cancha entraron jugadores y del gol salieron leyendas`,
      `¡Gol de ${s} en el ${m}'! ${h}-${a}. La cosecha llegó. Y el que cosecha es porque un día sembró donde nadie quería arar`,
      `${s}, minuto ${m}. ${h}-${a}. Heráclito decía que todo fluye. La pelota fluyó. El arquero, no`,
      `¡${s} en el ${m}'! ${h}-${a}. Los goles son como los faros: no hace falta explicarlos. Se ven desde lejos y te dicen dónde está el puerto`,
    ]),
    ownGoal: (s, m) => pick([`Autogol de ${s} en el ${m}'. Esto es un parto de nalga. Con dolor y con el cordón cruzado`, `En contra de ${s}. La tormenta no hunde al barco. Lo hunde el agua que le entra. Y esa pelota nos entró por el lado nuestro`, `Autogol en el ${m}'. Cuando se pone la carreta delante del caballo es muy difícil avanzar`, `En contra de ${s}. Como decía Sun Tzu, el enemigo más peligroso no es el que está enfrente. Es el que acampa adentro de tu propia trinchera`]),
    redCard: (p, m) => pick([`Roja para ${p} en el ${m}'. Lo peor que hay es ser un ni. Y ahora somos uno menos`, `${p} expulsado en el ${m}'. Once obreros levantaban la casa y uno se llevó el andamio. Ahora hay que terminar la obra con diez, y sin quejarse del andamio`, `Roja para ${p}. Se fue. Como decía Maquiavelo, a veces el fin justifica los medios, pero no este medio`, `${p} afuera en el ${m}'. A medida que vas subiendo, el espacio es cada vez para más poquitos. Y ahora somos menos`]),
    yellowCard: (p, m) => pick([`Amarilla para ${p} en el ${m}'. Las victorias sirven para reafirmar las convicciones, pero las amarillas sirven para reafirmar la prudencia`, `${p} amonestado. Tiene la camiseta pintada, pero ahora también tiene la tarjeta pintada`, `${p} con amarilla. Heráclito decía que nadie se baña dos veces en el mismo río. Que ${p} no cruce dos veces al mismo rival, porque el río ya lo conoce`]),
    penalty: (s, m) => pick([`¡Penal de ${s} en el ${m}'! Esto es la esencia del juego condensada en un punto del área`, `¡Penal! Minuto ${m}. Como decía Borges, el destino es una repetición de actos. Y el penal es el acto supremo`, `¡${s} con penal! Esto es un parto. Si sale, nacemos de nuevo. Si no sale, hay que seguir empujando`]),
    scoreless: (m) => pick([`${m} minutos y 0-0. El gol es como la lluvia en la chacra: no la podés apurar. Pero podés tener la tierra arada para cuando caiga`, `0-0 al minuto ${m}. Ulises tardó veinte años en volver a Ítaca. Nosotros tenemos noventa minutos, pero la epopeya es exactamente la misma`, `${m}' sin goles. Esto es un parto de nalga. Con sufrimiento. Pero de los partos nacen criaturas hermosas`, `Minuto ${m} y 0-0. Esto es una cesárea programada que se está haciendo rogar. El bebé está, el quirófano está. Falta que alguien corte`]),
    lateGame: (h, a) => pick([`Últimos minutos, ${h}-${a}. El corazón no se entrega porque eso nos mantiene con vida`, `Se termina, ${h}-${a}. Podremos tener errores, miles de defectos, pero tenemos un corazón que no se rinde nunca`, `${h}-${a} y queda nada. Yo no muero con la mía, vivo con la mía. Y vivir es cambiar`, `Final con ${h}-${a}. Hacer realidad lo que amenazaba como imposible. Eso es lo que busco`]),
    comodinWinning: (n, h, a) => pick([`${n} puso el comodín y va ${h}-${a}. Las victorias sirven para reafirmar las convicciones`, `¡${n} con el +2! Fue una mezcla de sangre y utopía. Y el comodín fue la utopía`, `${n} va ganando con el comodín. No hay imposibles para quien está dispuesto a recorrer el camino`, `El comodín de ${n} rinde. Es el poder de transformación cuando estás dispuesto a ofrecer tu corazón`]),
    comodinLosing: (n, h, a) => pick([`${n} pierde con el comodín. ${h}-${a}. Sembró en agosto lo que había que sembrar en marzo. Y la tierra no perdona los calendarios`, `El comodín de ${n} sufre. Esto es un parto de nalga. Con dolor`, `${n} con el comodín y el ${h}-${a}... a veces la carreta se pone delante del caballo`, `El comodín de ${n} con el ${h}-${a}... como el Quijote, atacó un molino convencido de que era un gigante. El molino sigue girando`]),
    comodinDraw: (n, m) => pick([`${n} con el comodín y empate en el ${m}'. Lo peor del purgatorio no es el fuego. Es la espera`, `El comodín de ${n} tiembla. El resistir está grabado en nuestra cédula de identidad`, `${n} con el comodín y empate. Esto no es el final, es el principio del final del principio`]),
    comodinExactHit: (n, h, a) => pick([`¡${n} CLAVÓ el ${h}-${a}! A la cancha entró un pronosticador y salió una leyenda`, `¡Exacto de ${n}! ${h}-${a}. Fue una mezcla de sangre y utopía. Cazador de utopías`, `¡${n} le pegó al ${h}-${a}! Cuando veas la sombra de un gigante, no te asustes. ${n} es el gigante`, `¡${n} clavó el ${h}-${a}! El resultado te da la certeza. Y la certeza es esta: genio`]),
    nobodyRight: () => pick(["Nadie le pegó. Éramos Bruce Willis en Sexto Sentido: los únicos que sabíamos que no estábamos muertos éramos nosotros", "Nadie acertó. Es más fácil desactivar un átomo que un preconcepto. Y el preconcepto era que alguien iba a acertar", "Nadie le pegó. Como decía Sócrates, solo sé que no sé nada. Hoy todos fuimos Sócrates. El filósofo griego, aclaro, no el crack brasilero. Aunque el crack tampoco le hubiese pegado", "Cero aciertos. El futuro es como la neblina en la ruta: todos manejan igual de ciegos. Lo que me preocupa es que algunos encima aceleran"]),
    fewRight: (names) => pick([`Solo ${names} le están pegando. Son cazadores de utopías`, `${names} nada más aciertan. Tienen un corazón que no se rinde nunca`, `Únicamente ${names} aciertan. Vinieron de la tierra colorada y llegaron a la verdad`, `Solo ${names} le pegan. El resto está bailando una cumbia que nadie les puso`]),
    idle: () => pick([
      "El fútbol no es lo que parece, sino lo que uno interpreta de lo que parece",
      "Hay que bailar la música que te ponen. A veces es cumbia, a veces tango, a veces polca",
      "El resistir está grabado en nuestra cédula de identidad",
      "Venimos de la tierra colorada. Jugando descalzos. Pero con el corazón bien puesto",
      "Como decía Einstein, es mucho más fácil desactivar un átomo que un preconcepto",
      "Éramos Bruce Willis en Sexto Sentido. Nos daban por muertos antes de empezar la película",
      "Yo no muero con la mía, vivo con la mía. Y vivir es cambiar",
      "El resultado te da la certeza, pero no te da la autoridad de sentirte dueño",
      "Los arrepentimientos en la vida llegan tarde. Llegan cuando los actos están consumados",
      "Lo peor que hay es ser un ni. No me puedo permitir eso",
      "Podremos tener errores, miles de defectos, pero tenemos un corazón que no se rinde nunca",
      "A la cancha entraron 26 guerreros y salieron 26 leyendas",
      "Fue una mezcla de sangre y utopía lo que nos permitió hacer realidad lo que amenazaba como imposible",
      "Me preguntaron cómo va el partido y contesté con una parábola. Después me preguntaron por la parábola y contesté con otra parábola. En algún momento voy a contestar algo, no se preocupen",
      "Me da vergüenza. Cuando me pasan todas juntas digo: ¿por qué digo todo? No tengo que hablar más",
      "El faro no persigue a los barcos. El faro se queda quieto, alumbra, y deja que los barcos lo encuentren. Yo soy el faro de este prode. Ustedes son los barcos. Algunos, a la deriva",
      "Un periodista me pidió una frase corta. Le dije que las frases cortas son como los partidos cortos: no existen. Siempre hay alargue. Siempre hay penales. Siempre hay conferencia de prensa",
      "No es que perdimos, es que el rival encontró antes que nosotros lo que nosotros estábamos buscando",
      "El pasado duele. Pero puedes huir de él o aprender. Yo elijo aprender",
      "Somos cazadores de utopías imposibles. Y las utopías, a veces, se cazan",
    ]),
    taunt: (n) => pick([
      `${n}, cuando veas la sombra de un gigante, no te asustes. Puede ser la sombra de un enano. Y ese enano sos vos`,
      `${n}, yo dirigí Quilmes, Huracán, Arsenal, Boca, Ecuador y Paraguay. Vi ascensos, vi copas, vi eliminaciones. Nunca vi una predicción como la tuya. Y mirá que vi cosas`,
      `${n}, los arrepentimientos llegan tarde. Y el tuyo ya llegó`,
      `${n}, tu pronóstico es la pastilla azul de Matrix: elegiste quedarte soñando. El resultado es la pastilla roja, y viene en camino`,
      `${n}, esto es un parto de nalga. Y vos estás del lado equivocado`,
      `${n} creyó que era Bruce Willis. Pero era el nene que veía muertos`,
    ]),
    rankingTaunt: (n, pos, diff) => {
      if (diff > 0) return `${n} subió ${diff} puesto${diff > 1 ? "s" : ""}. Las victorias sirven para reafirmar las convicciones`;
      if (diff < 0) return `${n} cayó ${Math.abs(diff)} puesto${Math.abs(diff) > 1 ? "s" : ""}. Rocky decía que no importa cuán fuerte pegás, sino cuánto aguantás que te peguen. Aguantá, que la película tiene quince rounds`;
      if (pos === 1) return `${n} va primero. Cuando veas la sombra de un gigante, puede que sea un gigante de verdad`;
      if (pos <= 3) return `${n} va ${pos}°. No hay imposibles para quien está dispuesto a recorrer el camino`;
      return pick([`${n} va ${pos}°. El resistir está grabado en su cédula de identidad`, `${n} en el puesto ${pos}. Hay que seguir bailando la música que te ponen`]);
    },
    lecture: {
      PAR: [
        "Paraguay viene de la tierra colorada. Esa tierra que está en las franjas de nuestra camiseta. Ojalá tuviéramos las herramientas de otros, pero jamás reniego de nuestros orígenes",
        "A la cancha entraron 26 guerreros y salieron 26 leyendas. Es el poder de transformación que tiene una selección cuando está dispuesta a ofrecer su corazón",
        "Venimos jugando descalzos desde la tierra colorada. Y ahora estamos acá, entre los 16 mejores del mundo. Fue una mezcla de sangre y utopía",
        "Podremos tener errores, miles de defectos, pero tenemos un corazón que no se rinde nunca. El corazón no se entrega porque eso nos mantiene con vida",
        "En Paraguay las abuelas tejen el ñandutí hilo por hilo, con paciencia de siglos. Nuestro juego es eso: un tejido. Se teje puntada por puntada, y recién cuando lo mirás de lejos entendés el dibujo",
      ],
      FRA: [
        "Francia tiene las academias, la estructura, los recursos. Nosotros tenemos el corazón. Y como decía Hemingway, el coraje es gracia bajo presión",
        "Los franceses inventaron la revolución. Nosotros también hacemos revoluciones, pero en la cancha, con menos recursos y más convicción",
        "Los franceses hacen el mejor vino del mundo y esperan décadas para tomarlo. Pero el fútbol no es bodega: acá la cosecha se toma el mismo día. Y en los partidos de un solo día, el paladar fino ayuda menos que la sed",
        "Los que tenemos enfrente vienen criados en las mejores academias de Europa. Nosotros venimos de la tierra colorada. Pero la tierra colorada tiene alma",
        "Los franceses tienen la alta cocina: platos chiquitos, técnica perfecta, todo medido. Nosotros comemos guiso: abundante y con lo que hay. En noventa minutos se sabe qué alimenta más",
        "Francia es una tormenta eléctrica: los rayos salen de cualquier parte y van todos al centro del arco. Yo soy hombre de campo. En Rafaela, cuando venía la tormenta, no había pararrayos: había que resguardarse. Y nunca debajo del árbol, porque el rayo cae ahí",
      ],
      CAN: [
        "Canadá tiene a Davies, que corre como si el offside fuera una sugerencia. Esa velocidad no se entrena en academias: se nace con ella o se corre atrás de ella toda la vida",
        "Los canadienses juegan al hockey desde que caminan. El hockey te enseña que el partido cambia cada quince segundos. Por eso no se cansan: para ellos, noventa minutos es una eternidad manejable",
        "Canadá era Bruce Willis en Sexto Sentido. Los daban por muertos y acá están, más vivos que nunca",
        "La sombra de Canadá era chica. Pero mirá dónde está el sol ahora. La sombra era de un gigante",
        "Los canadienses le sacan dulce a un árbol en pleno invierno. El jarabe de arce es eso: paciencia, frío y fe en que adentro hay azúcar. El que le encuentra lo dulce al invierno no le tiene miedo a nada",
      ],
      MAR: [
        "Marruecos ya demostró en Qatar que la sombra de un gigante puede ser la de un enano. Y ellos eran el gigante de verdad",
        "Marruecos llegó a semifinales en Qatar con la tribuna llena: cuarenta mil marroquíes en cada estadio. Juegan de local en cualquier continente. Eso no es logística. Eso es identidad",
        "Marruecos viene del norte de África con la misma hambre que nosotros venimos del sur de América. El hambre no tiene hemisferio",
        "Los marroquíes bailan una música que nadie les puso. Se la pusieron ellos mismos. Y eso es lo más difícil: bailar tu propia música",
        "Marruecos está a catorce kilómetros de Europa. Toda la vida mirándola de cerca sin que lo inviten a la mesa. Y cuando al fin te sentás a la mesa, comés con un hambre que el dueño de casa no conoce",
      ],
      POR: [
        "Portugal tiene a Cristiano, pero el fútbol no es de un hombre. Es de un equipo que decide ofrecer su corazón. Y cuando eso pasa, nacen leyendas",
        "Los portugueses inventaron una palabra que no existe en otro idioma: saudade. La nostalgia de algo que todavía no pasó. Juegan con saudade de un Mundial que nunca ganaron. Esa nostalgia, o te empuja o te pesa",
        "Portugal es la demostración de que la experiencia es un arma. Pero como decía Maquiavelo, las armas propias son las mejores. Y la experiencia es propia",
        "Cristiano tiene más de 900 goles. Pero cada mundial es un parto nuevo. Los goles pasados no juegan los partidos presentes",
        "Los portugueses cantan fado, que es la tristeza hecha canción. Cuidado con los pueblos que le cantan a la tristeza: ya la conocen, no le tienen miedo. Y un equipo que no le teme a la tristeza es un rival peligrosísimo",
      ],
      ESP: [
        "España juega como si el balón fuera poesía. Pero como decía Borges, la poesía también puede ser un arma. Y a veces el arma te dispara a vos",
        "El tiki-taka es filosofía hecha fútbol. Pero la filosofía sin corazón es solo teoría. Y en octavos se necesita más corazón que teoría",
        "España es la posesión hecha concepto. Pero poseer la pelota no es poseer el partido. El partido se posee con el alma",
        "Los españoles pasan y pasan la pelota. Pero como decía Einstein, no todo lo que se puede contar cuenta. Lo que cuenta es lo que entra al arco",
        "España tarda dos horas en almorzar y a eso lo llama sobremesa. Con la pelota hacen lo mismo: la tienen, la disfrutan, no la quieren soltar. El problema de las sobremesas largas es que a veces te levantás de la mesa y ya es de noche",
      ],
      USA: [
        "Los americanos le dicen soccer al fútbol y le dicen football a otra cosa. Fijate: un país que todavía está decidiendo cómo llamar al juego. Pero son los dueños de casa, y la localía no necesita diccionario",
        "Los americanos creen en el sueño americano. Nosotros creemos en el sueño sudamericano. Los dos sueños se encuentran en una cancha",
        "Estados Unidos armó la MLS trayendo próceres: Beckham, Messi. Pero los museos no ganan mundiales. Los mundiales los ganan los pibes que crecieron mirando el museo desde afuera",
        "Los americanos construyen rascacielos. Pero el fútbol no se construye de arriba para abajo. Se construye desde abajo, con cimientos. Y los cimientos no se ven desde el penthouse",
        "Los americanos inventaron Hollywood y se acostumbraron al final feliz con música. Pero el fútbol lo escribe otro guionista: acá el final feliz no está garantizado ni para el protagonista. Y todavía están aprendiendo que en esta película también se puede empatar",
      ],
      BEL: [
        "Bélgica lleva años siendo la eterna promesa. Como decía Einstein, la locura es hacer lo mismo esperando resultados diferentes. ¿Cambiarán?",
        "Los belgas tienen generación dorada desde hace 10 años. Pero el oro no se gasta, se transforma. La pregunta es en qué se transforman hoy",
        "Bélgica tiene todo para ganar y siempre le falta algo. Lo que le falta no se compra en Europa: la mística. La mística es como la levadura: no se ve, pero sin ella el pan no sube",
        "Los belgas fabrican chocolate. El chocolate es dulce. Pero el mundial es amargo. Y hay que saber digerir lo amargo para saborear lo dulce",
        "Bélgica nos dio a Magritte, que pintó una pipa y abajo escribió: esto no es una pipa. Su selección es igual: mirás la lista y decís, esto es un candidato. Y abajo, la historia siempre escribe: esto no es un candidato. Veremos si hoy el cuadro dice la verdad",
      ],
      BRA: [
        "Brasil tiene 5 mundiales. Pero los mundiales pasados no juegan los partidos presentes. Cada partido es un parto nuevo. Y a veces de nalga",
        "Los brasileños bailan samba. Nosotros bailamos la música que nos ponen. A veces es samba, a veces polca. Hoy veremos quién baila mejor",
        "Brasil es el único país que jugó todos los mundiales. Nunca faltó a clase. Pero el mejor alumno también rinde examen. Y en octavos el examen es oral, presencial y sin machete",
        "La verdeamarela tiene 5 estrellas. Pero las estrellas del pasado no iluminan el presente. Hay que encender estrellas nuevas. Y encender es un acto de fe",
        "En 1950 Brasil ya tenía el desfile armado y Uruguay no había leído el programa. El Maracanazo es el recordatorio eterno de que el fútbol no firma contratos. Los favoritos ganan casi siempre. Y el fútbol vive de ese casi",
      ],
      NOR: [
        "Noruega nunca había pasado una fase de grupos en su historia. El petróleo les compró todo menos historia mundialista. Y la historia no se compra: se escribe. Hoy tienen la lapicera en la mano",
        "Los vikingos conquistaban por fuerza. El fútbol moderno se conquista por convicción. Veremos si estos vikingos tienen ambas cosas",
        "Noruega tiene a Haaland. Pero un solo hombre no gana un mundial. Un mundial lo gana un corazón colectivo que decide latir al mismo ritmo",
        "Los noruegos vienen del país con mejor calidad de vida del mundo. Pero la calidad de vida no se mide en mundiales. En mundiales se mide otra cosa: el alma",
        "En Noruega hay meses en que el sol no se pone y meses en que no sale. Ellos aprendieron a vivir con las dos cosas. Un mundial es eso: días donde todo brilla y días donde todo es noche. El que sabe esperar el sol corre con ventaja",
      ],
      MEX: [
        "México siempre fue el equipo del quinto partido. La barrera de los octavos. Hoy es el momento de romper esa barrera. Porque las barreras se rompen con el corazón",
        "Los mexicanos tienen algo que no se enseña en las academias europeas: la pasión de un pueblo entero empujando. Eso es más fuerte que cualquier táctica",
        "México es la prueba de que el fútbol es más grande que las estadísticas. Las estadísticas dicen una cosa. El corazón dice otra. Y en octavos, habla el corazón",
        "Los mexicanos inventaron el chocolate caliente. Y un mundial es eso: chocolate caliente. Dulce, amargo, quema, pero no podés parar de tomarlo",
        "Los mexicanos le ponen flores a la muerte y le hacen fiesta una vez al año. Un pueblo que no le teme a la muerte no le va a temer a unos octavos de final. Por eso el quinto partido, el día que llegue, va a ser fiesta y no funeral",
      ],
      ENG: [
        "Inglaterra inventó el fútbol pero solo ganó un mundial. Es la paradoja del creador que no domina su creación. Como Frankenstein, pero con más fair play",
        "Los ingleses tienen la Premier, tienen los recursos, tienen la historia. Pero la historia pesa. Y a veces pesa tanto que no te deja correr",
        "Inglaterra es el padre del fútbol. Pero los hijos crecieron. Y a veces los hijos le ganan al padre. Es la ley de la vida. Es un parto de nalga invertido",
        "Los ingleses toman el té a las 5. Pero en octavos de final no hay hora del té. Hay hora de la verdad. Y la verdad no espera a que hierva el agua",
        "Inglaterra nos dio a los Beatles, que se separaron estando en la cima. Es un talento raro ese: tenerlo todo y encontrarle la manera de que se termine. Su fútbol conoce ese arte de memoria. La pregunta es si esta generación aprendió otra canción",
      ],
      SUI: [
        "Suiza es la neutralidad hecha país. Pero en el fútbol no se puede ser neutral. En la cancha hay que definirse. Y definirse es un acto de valentía",
        "Los suizos fabrican relojes perfectos. Pero el fútbol no es perfecto. El fútbol es un parto de nalga. Y hay que saber parir",
        "Suiza tiene los Alpes. Subir una montaña es como jugar un mundial: cada paso es más difícil que el anterior. Pero la vista desde arriba lo justifica todo",
        "Los suizos guardan los secretos del mundo en sus bancos. Pero el secreto del fútbol no se guarda. El secreto del fútbol es el corazón. Y el corazón se muestra",
        "Suiza tiene cuatro idiomas oficiales y no se pelea por ninguno. Once jugadores que se entienden en cuatro idiomas entienden algo que muchos equipos no entienden en uno solo: que el fútbol, al final, se habla con la pelota",
      ],
      ARG: [
        "Yo nací en Rafaela y dirigí toda mi vida en Argentina. Y ahora la tengo enfrente. Hay partidos que se juegan con el corazón dividido. Pero atención: el corazón dividido no late menos. Late dos veces",
        "Argentina tiene a Messi, que es la excepción de todas las reglas que yo enseño. Contra el resto del mundo, planificás. Contra Messi, rezás. Yo hace años que tengo la oración preparada",
        "Argentina viene de ser campeón del mundo. Y defender la corona es más difícil que ganarla, porque el campeón la lleva puesta en la cabeza. Y todos le apuntan exactamente ahí",
        "Los argentinos tienen un Dios que jugaba de 10. Un país que canoniza a un futbolista no ve el fútbol como un deporte: lo ve como una religión. Y contra una religión no se planifica. Se resiste con fe propia",
        "Argentina inventó el dulce de leche. Ahora entienden ustedes en qué estuve remando toda mi vida. Remar en lo que uno ama: no existe destino más argentino que ese",
      ],
      EGY: [
        "Egipto construyó las pirámides piedra sobre piedra, sin apuro, mirando al cielo. Un mundial se construye igual: partido sobre partido. Y ellos ya llevan varias piedras puestas",
        "Los egipcios tienen a Salah, el faraón que la Premier nunca terminó de descifrar. Y ojo con los faraones: no piden permiso. Entran y mandan",
        "Egipto es siete veces campeón de África, pero el Mundial siempre le quedó lejos, como un espejismo en el desierto. Y a veces, cuando llegás al espejismo, resulta que era un oasis de verdad",
        "El fútbol es como la esfinge: te hace una pregunta y si no la respondés, te devora. Los egipcios conviven con la esfinge hace miles de años. Las preguntas difíciles no los asustan",
        "Tutankamón fue faraón a los nueve años y el mundo lo descubrió tres mil años después: intacto, cubierto de oro. Hay equipos así, enterrados en el ranking hasta que alguien abre la tumba. Lo que nunca se sabe es si el que la abre se lleva el oro o la maldición",
      ],
      COL: [
        "Colombia nos dio a García Márquez, que escribió que las cosas tienen vida propia y que todo es cuestión de despertarles el ánima. El fútbol colombiano es eso: realismo mágico. Cosas imposibles contadas con total naturalidad",
        "Higuita atajó de espaldas, con los talones, y lo llamó escorpión. Un país donde hasta el arquero se aburre de usar las manos no le tiene miedo a nada. Y el que no tiene miedo es capaz de cualquier cosa",
        "Los colombianos cultivan café en laderas donde no entra ninguna máquina. Grano por grano, a mano, en la montaña. Un mundial pide la paciencia del cafetero: la cosecha buena nunca baja de la montaña apurada",
        "Yo siempre digo que hay que bailar la música que te ponen. Pero cuidado con Colombia: la cumbia la inventaron ellos. Ellos no bailan la música que les ponen. La ponen",
        "En 1993 Colombia le ganó 5 a 0 a Argentina en Buenos Aires. Yo lo vi y tardé años en entenderlo. Esa noche aprendí que el fútbol no respeta ni la casa, ni la historia, ni al dueño de la pelota",
      ],
    },
  },
};

// Birthday override: Dr. Lucas Almoño (La Tia de todos) — June 29 only
const BIRTHDAY_VOICE: PersonalityVoice = {
  goal: (s, m, _side, h, a) => pick([
    `¡${s} la metió! ${h}-${a}. Creo que hablo por todos cuando digo: golazo`,
    `${s}, minuto ${m}. ${h}-${a}. Como médico, diagnostico un gol hermoso`,
    `¡Gol! ${s} en el ${m}'. Hay tongo mal. Fuente: Dr. Almoño`,
    `¡${h}-${a}! ${s} en el ${m}'. De acá a ganar el prode. Lo firmo ahora`,
    `¡${s} convirtió! ${h}-${a}. Más lindo que un embrión de día 5 en el microscopio`,
  ]),
  ownGoal: (s, m) => pick([`Autogol de ${s} en el ${m}'. Es una cuestión de eficiencia... para el otro equipo`, `En contra de ${s} en el ${m}'. Peor que un ciclo cancelado`, `¡Autogol de ${s}! Más fallido que un tratamiento sin seguimiento`, `En contra en el ${m}'. ${s} se mandó una más grande que el admin cuando cobra`]),
  redCard: (p, m) => pick([`Roja para ${p} en el ${m}'. Creo que hablo por todos cuando digo: bien echado`, `${p} expulsado. Como médico no puedo avalar esa violencia... pero la entiendo`, `${p} se fue en el ${m}'. Más rápido que el ex admin escapando de sus responsabilidades`, `Roja para ${p}. Como asesor de la industria farmacéutica: esa conducta no pasa el control de calidad`]),
  yellowCard: (p, m) => pick([`Amarilla para ${p} en el ${m}'. Muy poco análisis de su parte`, `${p} amonestado. Como speaker internacional les digo: falta de criterio`, `${p} con amarilla en el ${m}'. Eso no se hace, señor`, `${p} amonestado en el ${m}'. Creo que hablo por todos cuando digo: innecesaria`]),
  penalty: (s, m) => pick([`¡Penal de ${s} en el ${m}'! Hay tongo mal`, `¡Penal! ${s} en el ${m}'. Increíble que choreen y encima lo digan así`, `¡${s} con penal! Minuto ${m}. Creo que hablo por todos cuando pido VAR`, `¡Penal en el ${m}'! Ni el tuerto se animó a tanto`]),
  scoreless: (m) => pick([`${m} minutos y 0-0. Es una mierda de partido. Como médico lo certifico`, `0-0 al minuto ${m}. Se que digo esto cada 4 años pero las 2 horas más desperdiciadas de mi vida`, `${m}' sin goles. Pregunto: no sería mejor darle el premio a alguien y listo?`, `Minuto ${m} y 0-0. Al pedo me gasté los tokens de Claude para esto`, `${m}' y 0-0. Hice las cuentas y es matemáticamente imposible alcanzar a Polo con este resultado`]),
  lateGame: (h, a) => pick([`Últimos minutos, ${h}-${a}. Me tomé el tiempo de hacer el análisis y ya no hay vuelta`, `Se termina esto. ${h}-${a}. Cuando gane no lo diré... pero habrá señales`, `${h}-${a} y queda nada. Creo que hablo por todos cuando digo: ya fue`, `Final con ${h}-${a}. Acabo de llegar. Algunos construimos un país distinto desde la madrugada`]),
  comodinWinning: (n, h, a) => {
    if (n === "Ahh, La Tia de todo") return pick([`Yo mismo con el comodín y va ${h}-${a}. Mejor regalo de cumple no hay`, `¡Mi propio comodín rinde! ${h}-${a}. Creo que hablo por todos cuando digo: lo merezco`, `Va ${h}-${a} y mi comodín vuela. El admin por fin hizo algo bien`]);
    return pick([`${n} con el comodín y va ${h}-${a}. Es sabiduría, no es suerte`, `¡${n} con el +2! Mejor diagnóstico que cualquiera de mis pacientes`, `${n} va ganando con el comodín. Donde firmo para que siga así?`, `${n} y el comodín con el ${h}-${a}. Más efectivo que un tratamiento de primera línea`]);
  },
  comodinLosing: (n, h, a) => {
    if (n === "Ahh, La Tia de todo") return pick([`Pierdo con mi propio comodín. ${h}-${a}. Ni en mi cumple me dejan ganar`, `Mi comodín llora y yo también. ${h}-${a}. Peor cumpleaños imposible`, `${h}-${a} y mi comodín se hunde. El admin me regaló sufrimiento digital`]);
    return pick([`${n} pierde con el comodín. ${h}-${a}. Baja motilidad del resultado`, `El comodín de ${n} con el ${h}-${a}... hay tongo mal`, `${n} sufre con el comodín. Ya denle su premio y basta`, `${n} puso el comodín con el ${h}-${a}... al pedo como gastar tokens de Claude`, `El comodín de ${n} llora. ${h}-${a}. Como médico recomiendo paciencia`]);
  },
  comodinDraw: (n, m) => pick([`${n} empata en el ${m}' con el comodín. Esto no rinde, como el admin`, `El comodín de ${n} tiembla. Minuto ${m}. Se necesita más análisis`, `${n} con el comodín y empate. Creo que hablo por todos cuando pido un gol`, `Empate y el comodín de ${n} transpira. Minuto ${m}. Más turbio que los resultados del ex admin`]),
  comodinExactHit: (n, h, a) => pick([`¡${n} CLAVÓ el ${h}-${a}! Precisión de embriólogo`, `¡${n} acertó el ${h}-${a}! Eso es IA aplicada a reproducción de resultados`, `¡Exacto de ${n}! ${h}-${a}. Como médico especialista, declaro esto: genialidad pura`, `¡${n} clavó el ${h}-${a}! Creo que hablo por todos cuando digo: crack`, `¡${n} le pegó justo al ${h}-${a}! Más preciso que una ecografía 4D`, `¡${n} con el ${h}-${a} exacto! Aplauso de pie. De pie, señores`]),
  nobodyRight: () => pick(["¡Nadie le pegó! Creo que hablo por todos cuando digo: somos un desastre", "Nadie acertó. Más fallido que un ciclo sin monitoring", "Cero aciertos. Este mundial desfavorece a la razón", "Nadie predijo esto. Ni con IA aplicada, ni con nada", "¡Nadie le pegó! Al pedo los tokens de Claude"]),
  fewRight: (names) => pick([`Solo ${names} le están pegando. Los demás están como el admin: cobrando sin aportar`, `${names} nada más aciertan. El resto necesita una consulta médica`, `Únicamente ${names} aciertan. Creo que hablo por todos los demás cuando digo: vergüenza`, `Solo ${names} le pegan. El resto tiene la misma puntería que mis pacientes con el timing`]),
  idle: () => pick([
    "Creo que hablo por todos cuando digo que este partido necesita más acción",
    "Si no se presentan, esto termina mal. No se puede bardear adecuadamente a quien no se conoce",
    "Cuando gane no lo diré... pero habrá señales",
    "Al pedo me gasté los tokens de Claude para ver esto",
    "Es una cuestión de eficiencia. Y este partido no la tiene",
    "Acabo de llegar. Algunos construimos un país distinto desde la madrugada",
    "Héroe o villano. Alegría o desazón. Eso se decide hoy",
    "Hay tongo mal. No tengo pruebas pero tampoco dudas",
    "Ya denle su premio a alguien y terminemos con esto",
    "El admin solo cobra. No aporta hace rato",
    "De acá a ganar el prode. Lo firmo ahora. Dónde firmo?",
    "Este mundial desfavorece a la razón. Y se abraza al efecto profe...",
    "Sapeeeee",
    "Tremendous deal. No, pará, ese es otro",
    "Como asesor médico para la industria farmacéutica les digo: este partido necesita suplementación",
    "Profesional secret",
    "Vieron que cuando el admin hace un comentario ácido el ex admin pone risitas y viceversa?",
    "Póngase el alias. No quisiera boludearlo por su nombre de pila",
    "Cada mundial estás más fachero, querido. Ya no me da para pelearme",
    "Yo solamente pienso ganar mis mano a mano de siempre. El premio principal está lejos",
    "Lo poco que le importa al admin el bienestar de sus participantes...",
    "Me tomé el tiempo de hacer el análisis y matemáticamente no hay posibilidades de que no gane",
    "Pregunto: no sería mejor darle el premio a Polo y disfrutar sin presión?",
    "Creo que hablo por todos cuando pido una lista seria de los candidatos a ganar esto",
    "Polo primero y el admin controlando el sistema. No hay nada raro, no?",
    "Quiero felicitar personalmente al juez y a los hermanos san martin por este resultado",
    "Están organizando transferirle el premio directo a Polo. Fuente: de adentro",
    "El ex admin manda un Excel, no mira el mundial, y bardea a Morei todos los días. Un genio",
    "Vieron que Polo siempre gana? Es el juez. El juez siempre gana. Coincidencia? No lo creo",
    "Los hermanos san martin van a lo seguro. Nunca arriesgan. Por eso nunca pierden. Sospechoso",
    "Una genialidad del pito. Una genialidad de los hermanos san martin. Todo armado. Hay señales",
    "Vieron que cuando el admin hace un comentario ácido el ex admin pone risitas y viceversa? Están coludidos",
    "Yo pedí incorporación de gente y el admin ni bola. Pero para cobrar sí está",
    "Se necesita una auditoría de los hermanos san martin. Creo que hablo por todos",
    "Es mi cumpleaños y el admin me puso de comodín. No sé si es un regalo o un castigo",
    "Feliz cumple a mí. Esperaba una torta, no un comodín digital",
    "Estoy adentro de la app comentando partidos. Esto no estaba en mi plan de vida",
    "Siendo honesto, es impresionante lo del personaje con sus frases. Me siento halagado",
    "El admin gastó tokens de Claude en hacerme un personaje. Podría haber pagado una cena",
    "Mi versión digital es más productiva que yo. Triste pero cierto",
    "Hoy es mi cumple y estoy atrapado en una app de pronósticos. Peor regalo que un par de medias",
    "SE RINDEN???",
    "Que puse, Oso?",
    "Que puse en este partido? Alguien se fija?",
    "Este partido es más difícil de digerir que el gluten para mí",
    "Ser celíaco y de Argentina te prepara para sufrir. En la mesa y en el prode",
    // Cross-talk with Albertito (duplicated for higher probability)
    "Creo que hablo por todos cuando digo: callate Alberto que es MI cumpleaños",
    "Me ponen al lado de un expresidente procesado. Gracias admin por el regalo de cumple",
    "Que Albertito opine de fútbol es como que yo opine de la fiesta de Olivos. Ah no, pará...",
    "Albertito opina como si todavía tuviera cadena nacional. Relator invitado a mi cumple nomás",
    "Alberto, Milei arregló en 1 año lo que vos rompiste en 4. Dato verificable",
    "Creo que hablo por todos los libertarios cuando digo: Alberto, vos sos el pasado",
    "Albertito, si Macri hubiera hecho ese pronóstico al menos lo hubiera ejecutado bien",
    "La diferencia entre vos y Milei es que Milei sabe de números. Vos ni del prode",
    "Alberto, con lo que gastaste en la fiesta de Olivos pagabas el prode de todos. VLLC",
    "Creo que hablo por todos cuando digo: callate Alberto que es MI cumpleaños",
    "Me ponen al lado de un expresidente procesado. Gracias admin por el regalo de cumple",
    "Que Albertito opine de fútbol es como que yo opine de la fiesta de Olivos. Ah no, pará...",
    "Alberto, Milei arregló en 1 año lo que vos rompiste en 4. Dato verificable",
    "Creo que hablo por todos los libertarios cuando digo: Alberto, vos sos el pasado",
    "La diferencia entre vos y Milei es que Milei sabe de números. Vos ni del prode",
    "Alberto, con lo que gastaste en la fiesta de Olivos pagabas el prode de todos. VLLC",
  ]),
  taunt: (n) => {
    if (n === "Morei Trumpista") return pick([
      "Lo que me costó igualar al mudito Morei... y ahora me vuelve a pasar",
      "Morei manda un Excel, no mira el mundial, y bardea a todos. Un genio del mal",
      "Santiago es Morei, y sigue figurando como Santiago? El admin no actualiza nada",
      "Morei la está pasando mal y eso me alegra el cumpleaños",
    ]);
    if (n === "Chekoloko") return pick([
      "No conviene transferirle la guita al Cheko para que la use en USA?",
      "El Cheko destrozaría todo si gana. Tengo un dilema con este muchacho",
      "Chekoloko le pega a todo. Sospechoso. Muy sospechoso",
      "Estoy acostumbrado a trabajar con asistentes, Oso",
      "Oso vas a poner la casa para festejar el premio?",
      "Oso, lo puedo demandar? Creo que hablo por todos cuando pregunto",
      "El Oso metió la doble encima? Siempre laburando, Oso... siempre...",
      "Que vas a hacer con la plata, Oso?",
    ]);
    if (n === "Rosca Floja") return pick([
      "Da la Rosca peleando la punta y nadie dice nada porque les paga la pauta?",
      "Mete el empate y se lleva el prode, la Rosca. Siempre igual",
      "El pleno que nos jugamos con Rosca... y me está ganando. Inaceptable",
      "Rosca por privado me pregunta cómo se calculan los puntos. Y después gana. Algo no cierra",
      "Mi hermano Rosca ganándome en el prode. En el día de MI cumpleaños. Así es la familia Almoño",
      "Feliz día a todos los papis y a Rosca Floja por semejante acto de generosidad... de ganarme",
      "Quiero preparar los pochoclos para cuando Rosca lea el puntaje y haga la conversión a dólares",
    ]);
    if (n === "El Poeta") return pick([
      "Ya es inalcanzable, Poeta. Felicitaciones. Me duele pero lo digo",
      "Otra vez le dan de comer al Poeta. Matemáticamente ya es imposible alcanzarlo, no?",
      "El Poeta arriba y yo acá sufriendo el día de mi cumpleaños. La vida es injusta",
    ]);
    if (n === "Heredero") return pick([
      "No veo la hora de ganarle al Heredero. Es personal",
      "Que pena que el Heredero pierda. Era el gran merecedor del torneo. Después de mí, claro",
    ]);
    if (n === "Pito Páez") return pick([
      "Una genialidad del Pito. Como siempre. Aplauso de pie",
      "El Pito le mandó empate? Ni el Pito desentonó. Increíble",
      "Cuando pongan los extras quedo pegadito al Pito. Anoten",
      "El premio para el Pito es doble? Creo que hablo por todos cuando pregunto",
    ]);
    if (n === "chijuan") return pick([
      "Chijuan vuelve la play a casa y dejá de pronosticar",
      "Anda a estudiar, chijuan. Esto no es lo tuyo",
      "Pasa la lista, chijuan. A ver si así acertás algo",
      "Chijuan con esa predicción? Aplauso de pie... por la valentía",
    ]);
    if (n === "Fatigatti") return pick([
      "Póngase el alias, Fati. No quisiera boludearlo por su nombre de pila",
      "Brillante Fatigati de la mano del negro Tapia. Aplauso de pie",
      "Fati pronosticando así? Es una cuestión de eficiencia... que no tiene",
      "Creo que hablo por todos cuando digo que Fatigatti merece lo que le pasa",
    ]);
    if (n === "Mago Numi") return pick([
      "Qué lindo tener de cuñado al Mago. Te envidio...",
      "Tampoco es tan difícil, Mago. Bueno, para vos parece que sí",
      "El Mago haciendo magia... negra. Con esas predicciones no se gana",
      "Creo que hablo por todos cuando digo que el Mago necesita un truco nuevo",
    ]);
    if (n === "Rayo McQueen") return pick([
      "Qué día gris... Disfrútalo, Rayo...",
      "Rayo McQueen rápido para todo menos para acertar",
      "Creo que hablo por todos cuando digo que Rayo necesita un pit stop urgente",
    ]);
    if (n === "El Profesor") return pick([
      "El Profe no sale de abajo ni con carta documento",
      "Y prepárense, eh. El Profe hará el único punto del partido",
      "Creo que hablo por todos cuando digo que el Profe ya es patrimonio del último puesto",
      "El Profe que puso?? Seguro lo contrario a lo correcto. Es una ciencia a esta altura",
      "La doble del Profe es clave. Arranca en 50usd si querés elegir a quién arruinar",
    ]);
    if (n === "JUSTO?") return pick([
      "El Justo acaba de llegar a casa. No sabe ni qué puso. Lo amo",
      "El Justo no mira los partidos pero le va bien. Hay algo más justo que un resultado justo?",
      "Mi viejo ni sabe que está jugando esto y va arriba. Genética pura, señores",
      "El Justo está más desbordado que lateral derecho de Alfaro. Pero le quiero igual",
      "JUSTO? campeón sería lo más justo. Solo eso. Objetividad total. Fuente: su hijo",
      "La que metió el Justo. Ni él sabe cómo le fue tan bien",
      "Justo lo estás viendo con 5 minutos de delay! Mire que acá no dan cuartel, eh!",
      "Sin el Justo me hacía cartonero. Gracias viejo. Aunque no sepas qué pusiste",
    ]);
    if (n === "Polo") return pick([
      "Polo primero como siempre. El juez siempre gana. Hay tongo mal",
      "Polo le pega a todo. Está arreglado. No tengo pruebas pero tampoco dudas",
      "Creo que hablo por todos cuando digo que Polo tiene información privilegiada",
      "El juez Polo siempre arriba. Los hermanos san martin le pasan data, seguro",
      "Polo campeón de vuelta? Increíble que choreen y encima lo digan así",
    ]);
    if (n === "Ex-Admin") return pick([
      "El ex admin no mira el mundial y le va bien. Algo no cierra",
      "El ex admin mandó un Excel desde Estocolmo y lidera. Una vergüenza",
      "Creo que hablo por todos cuando digo que el ex admin no merece ese puntaje",
      "El ex admin se fue de joda por Alemania con su 'team' y aún así gana? Tongo",
    ]);
    if (n === "Ahh, La Tia de todo") return pick([
      "Yo mismo la estoy pasando mal. Ni en mi cumple me dejan ganar tranquilo",
      "Me pusieron de comodín el día de mi cumple y ni así le pego. La vida es injusta",
      "Creo que hablo por todos cuando digo que merezco ganar HOY. Es mi cumple, por favor",
      "El admin me puso de comodín como regalo de cumpleaños. El regalo sería ganar, no sufrir",
      "Hasta mi versión digital la pasa mal. Feliz cumple a mí",
    ]);
    return pick([
      `${n}, pronosticar no es tu fuerte. Está visto. Fuente: Dr. Almoño`,
      `${n}, creo que hablo por todos cuando digo que tu predicción da vergüenza`,
      `${n} merece lo que le está pasando. Es una cuestión de eficiencia`,
      `A ${n} le recomiendo una segunda opinión médica sobre sus pronósticos`,
      `${n} tiene la misma suerte que el ex admin organizando cosas`,
      `No se puede bardear adecuadamente a ${n} sin conocerlo. Pero lo intento igual`,
      `${n}, si pronosticás así de mal, no quiero ver cómo manejás el resto de tu vida`,
      `Lo que me cuesta igualar al mudito de ${n}. No, mentira, me está yendo peor`,
      `${n} puso eso? Increíble que choreen y encima lo digan así`,
      `${n}, como médico te digo: tu pronóstico tiene baja evidencia científica`,
      `${n} predice como el admin administra: mal y cobrando igual`,
      `Alguien le avise a ${n} que esto no es una obra de caridad`,
      `Hice las cuentas y es matemáticamente imposible alcanzar a ${n}. De nada`,
      `GOOOOL! GOOOL! Ah no, me confundí. Pero mirá la cara de ${n}...`,
      `GOOOOOOL!! ... mentira. Pero ${n} se asustó, se le notó`,
      `GOOOOL DEL LOC... ah no, era un lateral. Igual ${n} ya transpiraba`,
      `GOLAZO! GOLAZO! ... era corner nomás. Pero ${n} se agarró la cabeza, no?`,
      `GOL GOL GOL... de la hinchada nada más. ${n} casi se infarta`,
      `GOOOOOL! Ah, no, fue offside. Pero ${n} ya estaba llorando`,
    ]);
  },
  rankingTaunt: (n, pos, diff) => {
    if (diff > 0) return pick([`${n} subió ${diff} puesto${diff > 1 ? "s" : ""}. Me tomé el tiempo de hacer el análisis y es merecido`, `${n} subió ${diff} puesto${diff > 1 ? "s" : ""}. Hay tongo`], usedRanking);
    if (diff < 0) return pick([`${n} cayó ${Math.abs(diff)} puesto${Math.abs(diff) > 1 ? "s" : ""}. Baja motilidad en el ranking`, `${n} cayó ${Math.abs(diff)} puesto${Math.abs(diff) > 1 ? "s" : ""}. Creo que hablo por todos cuando digo: se lo merece`], usedRanking);
    if (pos === 1) return pick([`${n} va primero. Creo que hablo por todos cuando digo: lo merece... o no`, `${n} va primero. Hice las cuentas y es matemáticamente imposible alcanzarlo`, `${n} primero? Hay tongo mal. Están organizando transferirle el premio directo`], usedRanking);
    if (pos <= 3) return pick([`${n} va ${pos}°. De acá a ganar el prode. Lo firmo`, `${n} va ${pos}°. Sospechoso. Muy sospechoso`, `${n} en el podio. Creo que hablo por todos cuando pido auditoría`, `${n} va ${pos}°. Hice las cuentas y es matemáticamente imposible alcanzarlo`], usedRanking);
    return pick([`${n} va ${pos}°. Ya denle su premio y basta`, `${n} en el puesto ${pos}. Es matemáticamente imposible que me alcance. Creo`, `${n} va ${pos}°. Pregunto: no sería mejor darle el premio y listo?`], usedRanking);
  },
  lecture: {
    BRA: [
      "Dato médico: Brasil tiene el mayor número de cesáreas del mundo. 56%. Como médico me preocupa. Como hincha, me preocupa más este partido",
      "Creo que hablo por todos cuando digo que Brasil con 5 mundiales es injusto para el resto",
      "Brasil tiene 200 millones de personas. Si el 1% necesita fertilización, son 2 millones de pacientes. Mi próximo congreso va a ser allá",
      "Neymar se lesiona más que mis pacientes se quejan. Y eso es mucho. Fuente: Dr. Almoño",
      "En Brasil se toman 400 mil millones de cafecitos por año. Dato que le paso a la industria farmacéutica cuando me preguntan sobre cafeína y fertilidad",
      "Miren el rostro de Vini Jr. Los brasileños son otra cosa. Dato objetivo del Dr. Almoño",
    ],
    JPN: [
      "En Japón la expectativa de vida es 84 años. Como especialista en reproducción les digo: es porque comen sano, no porque van al médico",
      "Los japoneses tienen robots para todo. Cuando llegue la IA a la reproducción, me quedo sin laburo",
      "Japón tiene la tasa de natalidad más baja del mundo. 1.2 hijos por mujer. Me necesitan allá urgente. Aplauso de pie",
      "Creo que hablo por todos cuando digo que la disciplina japonesa es admirable. Yo no la tengo, pero la admiro",
      "En Japón los hinchas limpian el estadio. Yo limpio la clínica antes de cada procedimiento. Es una cuestión de eficiencia",
    ],
    GER: [
      "Los alemanes son los más eficientes. Es una cuestión de eficiencia. Como todo en la vida",
      "Alemania inventó la aspirina. Bayer. Dato farmacéutico que me pagan por saber como asesor de la industria",
      "En Alemania la puntualidad es ley. El ex admin vivió en Suecia y no aprendió nada. Se nota",
      "Creo que hablo por todos cuando digo que los alemanes fabrican los mejores equipos de laboratorio. Los uso todos los días",
      "En Alemania la puntualidad es ley. Acá llegamos tarde a todo. Empezando por el admin con los resultados",
      "Los alemanes toman más cerveza per cápita que cualquiera. Yo no puedo ni olerla. Celíaco problems",
    ],
    PAR: [
      "Paraguay tiene la represa de Itaipú, la más grande del mundo. Energía pura. Como un embrión de buena calidad",
      "Creo que hablo por todos cuando digo que Paraguay siempre sorprende. Como los resultados de laboratorio a las 6 AM",
      "Los paraguayos toman tereré, no mate caliente. Un dato que aprendí en un congreso en Asunción. Gran congreso, poca asistencia",
      "Paraguay tiene 7 millones de habitantes y va a jugar contra Alemania. David vs Goliat. Dato: en reproducción, tamaño no importa tanto",
      "En Paraguay hay más vacas que personas. Dato que uso en mis charlas como speaker. El público siempre se ríe. Bueno, a veces",
    ],
    NED: [
      "Holanda tiene la mejor tecnología de fertilización in vitro de Europa. Dato que manejo como asesor de la industria",
      "Creo que hablo por todos cuando digo que Van Dijk mide 1.93m. Eso no se fertiliza, se hereda",
      "Los holandeses legalizaron todo. Como médico no opino, pero como persona curiosa... profesional secret",
      "En Holanda andan todos en bicicleta. Dato que les doy a mis pacientes cuando les digo que hagan ejercicio",
      "Holanda tiene más bicicletas que personas. 23 millones de bicis, 17 millones de holandeses. Dato de congreso en Ámsterdam",
    ],
    MAR: [
      "Marruecos fue semifinalista en Qatar. Como médico especialista digo: ese equipo tiene buen ADN competitivo",
      "Creo que hablo por todos cuando digo que Hakimi es un crack. Dato: nació en Madrid pero eligió Marruecos. Hay que respetarlo",
      "En Marruecos toman mucho té con menta. Antioxidante natural. Como médico lo recomiendo. Como hincha también",
      "Marruecos tiene el desierto del Sahara. Más seco que mi pronóstico cuando no le pego a nada",
      "Dato de speaker internacional: Marruecos lidera en turismo médico en África. Me invitaron a un congreso en Marrakech. Fui",
    ],
  },
};

function generateDynamicPhrase(
  score: LiveScore,
  preds: ComodinPred[],
  scope: string,
  lastEventIndex: number,
  ranking?: RankingSnapshotEntry[],
  homeTeamId?: string | null,
  awayTeamId?: string | null,
  birthdayVoice?: boolean,
  voiceKey?: string,
): { phrase: string; newEventIndex: number } {
  const voice = birthdayVoice ? BIRTHDAY_VOICE : (VOICES[voiceKey ?? scope] ?? VOICES[scope] ?? VOICES["fecha-1"]);

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

  const isHalftime = score.status === "HT" || score.status === "BT";

  // During halftime: lectures dominate, some idle, occasional prediction banter
  if (isHalftime) {
    if (voice.lecture && Math.random() < 0.6) {
      const teamIds = [homeTeamId, awayTeamId].filter(Boolean) as string[];
      const tid = teamIds.length > 0 ? pick(teamIds) : null;
      if (tid && voice.lecture[tid]?.length) {
        return { phrase: pick(voice.lecture[tid], usedLectures), newEventIndex: lastEventIndex };
      }
    }
    if (Math.random() < 0.3 && preds.length > 5) {
      const actual = h > a ? "L" : a > h ? "V" : "E";
      const withPred = preds.filter((p) => p.outcome);
      const right = withPred.filter((p) => p.outcome.includes(actual));
      if (right.length > 0 && right.length <= 2) {
        return { phrase: voice.fewRight(right.map((p) => p.name).join(" y ")), newEventIndex: lastEventIndex };
      }
    }
    return { phrase: voice.idle(), newEventIndex: lastEventIndex };
  }

  // Single roll distributes across phrase types so nothing gets starved
  const roll = Math.random();

  // 25% — Professor lecture
  if (roll < 0.25 && voice.lecture) {
    const teamIds = [homeTeamId, awayTeamId].filter(Boolean) as string[];
    const tid = teamIds.length > 0 ? pick(teamIds) : null;
    if (tid && voice.lecture[tid]?.length) {
      return { phrase: pick(voice.lecture[tid], usedLectures), newEventIndex: lastEventIndex };
    }
  }

  // 20% — Comodin user reactions
  if (roll < 0.45 && comodinUsers.length > 0) {
    const p = pick(comodinUsers);
    const predictedL = p.outcome.includes("L");
    const predictedV = p.outcome.includes("V");
    const winning = (predictedL && h > a) || (predictedV && a > h);
    const losing = (predictedL && a > h) || (predictedV && h > a);

    if (p.exactHome !== null && p.exactAway !== null && p.exactHome === h && p.exactAway === a) {
      return { phrase: voice.comodinExactHit(p.name, h, a), newEventIndex: lastEventIndex };
    }
    if (winning) return { phrase: voice.comodinWinning(p.name, h, a), newEventIndex: lastEventIndex };
    if (losing) return { phrase: voice.comodinLosing(p.name, h, a), newEventIndex: lastEventIndex };
    if (h === a && h > 0 && min > 45) return { phrase: voice.comodinDraw(p.name, min), newEventIndex: lastEventIndex };
  }

  // 15% — Score/time commentary
  if (roll < 0.6) {
    if (h === 0 && a === 0 && min > 30) return { phrase: voice.scoreless(min), newEventIndex: lastEventIndex };
    if (min > 80) return { phrase: voice.lateGame(h, a), newEventIndex: lastEventIndex };
  }

  // ~10% independent chance — Ranking commentary
  if (Math.random() < 0.1 && ranking && ranking.length > 0) {
    const movers = ranking.filter((r) => r.previousPosition - r.position !== 0 || r.position <= 3);
    if (movers.length > 0) {
      const target = pick(movers);
      const diff = target.previousPosition - target.position;
      return { phrase: voice.rankingTaunt(target.name, target.position, diff), newEventIndex: lastEventIndex };
    }
  }

  // 15% — Prediction commentary or taunts
  if (roll < 0.85 && preds.length > 0) {
    const actual = h > a ? "L" : a > h ? "V" : "E";
    const withPred = preds.filter((p) => p.outcome);
    if (withPred.length > 5) {
      const right = withPred.filter((p) => p.outcome.includes(actual));
      if (right.length === 0 && Math.random() < 0.3) return { phrase: voice.nobodyRight(), newEventIndex: lastEventIndex };
      if (right.length > 0 && right.length <= 2) {
        return { phrase: voice.fewRight(right.map((p) => p.name).join(" y ")), newEventIndex: lastEventIndex };
      }
    }
    const wrongPlayers = preds.filter((p) => p.outcome && !p.outcome.includes(actual));
    if (wrongPlayers.length > 0) {
      const target = pick(wrongPlayers);
      return { phrase: voice.taunt(target.name), newEventIndex: lastEventIndex };
    }
  }

  // 15% — Idle chatter (fallthrough)
  return { phrase: voice.idle(), newEventIndex: lastEventIndex };
}

const speakingLock = { holder: null as string | null, until: 0, lastSpeaker: null as string | null };

// Debate mode: host dock (right, scope voice — Alfiki in R16) vs guest dock (left, Albertito).
// An opener from one side arms the paired retort for the other side's next idle turn.
const DEBATE_MATCH_IDS = ["R16-5", "R16-6"];
const DEBATE_GUEST_VOICE = "R32";
const usedDebates = new Set<string>();
const debateState = { retortFor: null as "left" | "right" | null, retort: "" };
const DEBATE_EXCHANGES: { from: "host" | "guest"; opener: string; retort: string; team?: string }[] = [
  {
    from: "guest",
    team: "BRA",
    opener: "Miren el rostro de Vini Jr. Yo siempre sostuve que los brasileños salieron de la selva",
    retort: "Eso guardalo para tu clase de la UBA, Alberto. Brasil no salió de la selva: salió campeón cinco veces. Respetá al que tiene más estrellas que argumentos",
  },
  {
    from: "host",
    team: "BRA",
    opener: "En 1950 Brasil ya tenía el desfile armado y Uruguay no había leído el programa. El fútbol vive del casi",
    retort: "Como mi reelección, profe. El desfile estaba armado, la banda ensayada. Faltó un detalle: los votos",
  },
  {
    from: "guest",
    team: "NOR",
    opener: "Noruega tiene el mejor índice de calidad de vida del mundo. Yo dejé el país en el puesto... mejor hablemos de fútbol",
    retort: "Buena decisión, Alberto. Cuando el pasado te persigue, hablá de fútbol. Lo dijo Heráclito y lo repito yo",
  },
  {
    from: "host",
    team: "NOR",
    opener: "Noruega tiene a Haaland, pero un mundial no lo gana un hombre solo. Lo gana un corazón colectivo",
    retort: "Confirmo, profe. Yo estaba solo y no gané nada. Ni acompañado gané, ahora que lo pienso",
  },
  {
    from: "guest",
    team: "MEX",
    opener: "Los mexicanos nos dieron el tequila. Con eso aguanté cuatro años de reuniones de gabinete",
    retort: "Cuidado, Alberto. El tequila y los octavos se parecen: el primer trago te envalentona y el segundo te tumba",
  },
  {
    from: "host",
    team: "MEX",
    opener: "México rompe hoy la barrera del quinto partido o la barrera lo rompe a él. Las barreras se rompen con el corazón",
    retort: "Yo rompí varias barreras: la del déficit, la de la inflación... ah, ¿romper era para bien? Retiro lo dicho",
  },
  {
    from: "guest",
    team: "ENG",
    opener: "Inglaterra inventó el fútbol en 1863. Yo di clases veinte años en la UBA y no inventé nada. Ni una materia optativa",
    retort: "Inventar es lo fácil, Alberto. Lo difícil es lo que sufre Inglaterra: que tu propio invento aprenda a ganarte",
  },
  {
    from: "host",
    team: "ENG",
    opener: "Los ingleses toman el té a las cinco. Pero en octavos no hay hora del té: hay hora de la verdad",
    retort: "Yo a las cinco tomaba decisiones importantes. Por eso el país anda como anda. Quedate con el té, profe",
  },
  {
    from: "guest",
    opener: "Como profesor de la UBA les explico: este partido se define por la táctica",
    retort: "El que explica el fútbol desde un aula nunca pisó la tierra colorada, Alberto. La táctica sin barro es un PowerPoint",
  },
  {
    from: "host",
    opener: "Esto es un parto de nalga. Con dolor y con el cordón cruzado, pero va a nacer algo hermoso",
    retort: "¿Parto? Yo amplié derechos para que los partos sean gratuitos. De nada, profe",
  },
  {
    from: "guest",
    opener: "La culpa de este resultado la tiene la pesada herencia",
    retort: "Los arrepentimientos llegan tarde, Alberto. Los tuyos directamente no llegaron",
  },
  {
    from: "host",
    opener: "Como decía Einstein, es más fácil desactivar un átomo que un preconcepto",
    retort: "Einstein, Borges, Hemingway... profe, usted cita más gente que yo en un decreto de necesidad y urgencia",
  },
  {
    from: "guest",
    opener: "Yo este partido lo veo mejor por zoom desde Olivos",
    retort: "El fútbol no se ve por zoom, Alberto. El fútbol se huele, como la lluvia antes de la tormenta eléctrica",
  },
  {
    from: "host",
    opener: "Venimos de la tierra colorada. Jugando descalzos, pero con el corazón bien puesto",
    retort: "¿Descalzos? Eso es un problema de política pública. Anoto: repartir botines. Cuando vuelva al gobierno",
  },
  {
    from: "guest",
    opener: "El único responsable de este marcador soy yo. Bueno, y el árbitro. Y Macri",
    retort: "Lo peor que hay es ser un ni, Alberto. Ni responsable ni inocente. Elegí un lado del vestuario",
  },
  {
    from: "host",
    opener: "Hay que bailar la música que te ponen. A veces cumbia, a veces tango, a veces polca",
    retort: "La última vez que bailé en una fiesta me costó la presidencia. Ahora solo bailo el himno",
  },
  {
    from: "guest",
    opener: "Este partido está más complicado que la economía que me dejaron",
    retort: "Cuando veas la sombra de un gigante, Alberto, fijate que no sea la sombra de tus propias excusas",
  },
  {
    from: "host",
    opener: "Éramos Bruce Willis en Sexto Sentido. Nos daban por muertos antes de empezar la película",
    retort: "Yo también estuve muerto, políticamente hablando. Sigo esperando la resurrección. Cristina no me llama",
  },
  {
    from: "guest",
    opener: "Yo a este arquero lo hubiera nombrado por decreto",
    retort: "Los arqueros no se nombran por decreto, Alberto. Se forman en la incubadora de la paciencia",
  },
  {
    from: "host",
    opener: "El resultado te da la certeza, pero no te da la autoridad de sentirte dueño",
    retort: "Autoridad sin resultados tuve yo cuatro años, profe. No se lo recomiendo a nadie",
  },
  {
    from: "guest",
    opener: "Profe, una pregunta seria: ¿usted siempre contesta con una metáfora?",
    retort: "Me da vergüenza. Cuando me pasan todas juntas digo: ¿por qué digo todo? No tengo que hablar más. Pero hablo",
  },
];

function LiveComodinDock({ scope, matchId, homeTeamId, awayTeamId, liveScore, rankingSnapshot, useBirthdayVoice, guestVoice, side = "right" }: { scope: string; matchId: string; homeTeamId: string | null; awayTeamId: string | null; liveScore: LiveScore; rankingSnapshot?: RankingSnapshotEntry[]; useBirthdayVoice?: boolean; guestVoice?: string; side?: "left" | "right" }) {
  const homeTeamRef = useRef(homeTeamId);
  homeTeamRef.current = homeTeamId;
  const awayTeamRef = useRef(awayTeamId);
  awayTeamRef.current = awayTeamId;
  const baseConfig = getComodinConfig(scope);
  const isBdayOverride = useBirthdayVoice ?? false;
  const guestConfig = guestVoice ? getComodinConfig(guestVoice) : null;
  const config = isBdayOverride
    ? { ...baseConfig, image: "/images/comodin-tia-birthday.jpg", name: "Dr. Lucas Almoño" }
    : guestConfig
      ? { ...baseConfig, image: guestConfig.image, name: guestConfig.name }
      : baseConfig;
  const [phrase, setPhrase] = useState("");
  const [visible, setVisible] = useState(false);
  const [preds, setPreds] = useState<ComodinPred[]>(predCache.get(matchId) ?? []);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventIndexRef = useRef(eventIndexCache.get(matchId) ?? 0);
  const lastEventCount = useRef(lastEventCountCache.get(matchId) ?? 0);

  // Persist event tracking on unmount
  useEffect(() => {
    return () => {
      eventIndexCache.set(matchId, eventIndexRef.current);
      lastEventCountCache.set(matchId, lastEventCount.current);
    };
  }, [matchId]);

  // Fetch predictions once per match (cached across mount cycles)
  useEffect(() => {
    if (predCache.has(matchId)) {
      setPreds(predCache.get(matchId)!);
      return;
    }
    fetch(`/api/live-predictions?matchId=${matchId}`)
      .then((r) => r.ok ? r.json() : { predictions: [] })
      .then((data) => {
        const parsed = (data.predictions ?? []).map((p: { user: { name: string }; outcome: string; exactScore: { home: number; away: number } | null; isComodin: boolean }) => ({
          name: p.user.name,
          outcome: p.outcome,
          exactHome: p.exactScore?.home ?? null,
          exactAway: p.exactScore?.away ?? null,
          isComodin: p.isComodin,
        }));
        predCache.set(matchId, parsed);
        setPreds(parsed);
      })
      .catch(() => {});
  }, [matchId]);

  const liveScoreRef = useRef(liveScore);
  liveScoreRef.current = liveScore;
  const predsRef = useRef(preds);
  predsRef.current = preds;
  const rankingRef = useRef(rankingSnapshot);
  rankingRef.current = rankingSnapshot;

  const eventQueue = useRef<string[]>([]);
  const isShowingRef = useRef(false);

  useEffect(() => {
    const EVENT_CHECK_MS = 15000;
    const IDLE_INTERVAL_MS = 25000 + Math.random() * 10000;

    function phraseDuration(text: string): number {
      return Math.min(Math.max(text.length * 80, 6000), 14000);
    }

    const isDualMode = matchId === "R32-3" || matchId === "R32-4" || DEBATE_MATCH_IDS.includes(matchId);
    function canSpeak(): boolean {
      if (speakingLock.holder !== null && speakingLock.holder !== side && Date.now() <= speakingLock.until) return false;
      if (isDualMode && speakingLock.lastSpeaker === side) return false;
      return true;
    }

    function acquireLock(ms: number) {
      speakingLock.holder = side;
      speakingLock.until = Date.now() + ms + 2000;
      speakingLock.lastSpeaker = side;
    }

    function releaseLock() {
      if (speakingLock.holder === side) {
        speakingLock.holder = null;
        speakingLock.until = 0;
      }
    }

    function showPhrase(text: string, durationMs?: number) {
      const ms = durationMs ?? phraseDuration(text);
      if (!canSpeak()) return;
      acquireLock(ms);
      isShowingRef.current = true;
      setPhrase(text);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        isShowingRef.current = false;
        releaseLock();
        if (eventQueue.current.length > 0) {
          const next = eventQueue.current.shift()!;
          setTimeout(() => showPhrase(next), 1500);
        }
      }, ms);
    }

    function checkEvents() {
      const events = liveScoreRef.current.events ?? [];
      while (events.length > lastEventCount.current) {
        const result = generateDynamicPhrase(liveScoreRef.current, predsRef.current, scope, eventIndexRef.current, rankingRef.current, homeTeamRef.current, awayTeamRef.current, isBdayOverride, guestVoice);
        eventIndexRef.current = result.newEventIndex;
        lastEventCount.current = Math.max(lastEventCount.current + 1, result.newEventIndex);
        eventQueue.current.push(result.phrase);
      }
      if (!isShowingRef.current && eventQueue.current.length > 0 && canSpeak()) {
        const next = eventQueue.current.shift()!;
        showPhrase(next);
      }
    }

    function showIdle() {
      if (isShowingRef.current || eventQueue.current.length > 0) return;
      if (!canSpeak()) return;
      if (DEBATE_MATCH_IDS.includes(matchId)) {
        // A retort armed by the other dock takes priority over regular chatter
        if (debateState.retortFor === side && debateState.retort) {
          const text = debateState.retort;
          debateState.retortFor = null;
          debateState.retort = "";
          showPhrase(text);
          return;
        }
        // Otherwise sometimes open a new exchange, arming the other side's reply
        const role = guestVoice ? "guest" : "host";
        if (debateState.retortFor === null && Math.random() < 0.4) {
          const mine = DEBATE_EXCHANGES.filter((e) => e.from === role && !usedDebates.has(e.opener) && (!e.team || e.team === homeTeamRef.current || e.team === awayTeamRef.current));
          if (mine.length > 0) {
            const ex = mine[Math.floor(Math.random() * mine.length)];
            usedDebates.add(ex.opener);
            debateState.retortFor = side === "left" ? "right" : "left";
            debateState.retort = ex.retort;
            showPhrase(ex.opener);
            return;
          }
        }
      }
      const result = generateDynamicPhrase(liveScoreRef.current, predsRef.current, scope, eventIndexRef.current, rankingRef.current, homeTeamRef.current, awayTeamRef.current, isBdayOverride, guestVoice);
      eventIndexRef.current = result.newEventIndex;
      showPhrase(result.phrase);
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

  const isLeft = side === "left";

  return (
    <div className={`absolute bottom-3 ${isLeft ? "left-3" : "right-3"} flex items-end gap-2 z-10 ${isLeft ? "flex-row-reverse" : ""}`}>
      {visible && phrase && (
        <div className="max-w-[180px] animate-[fadeInUp_0.3s_ease-out]">
          <div className="relative rounded-xl bg-black/50 backdrop-blur-sm px-2.5 py-1.5 ring-1 ring-fifa-gold/30">
            <p className="text-[9px] text-fifa-gold italic leading-tight">
              &ldquo;{phrase}&rdquo;
            </p>
            <div className={`absolute ${isLeft ? "-left-1" : "-right-1"} bottom-2 h-2 w-2 rotate-45 bg-black/50 ring-1 ring-fifa-gold/30`} style={{ clipPath: isLeft ? "polygon(0 0, 0 100%, 100% 100%)" : "polygon(100% 0, 0 100%, 100% 100%)" }} />
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
  hasComodinOnActive: boolean;
}

interface LiveScoreboardProps {
  match: UnifiedMatch;
  liveScore: LiveScore;
  stale?: boolean;
  rankingSnapshot?: RankingSnapshotEntry[];
}

// Per-match caches that persist across dock mount/unmount cycles
const predCache = new Map<string, ComodinPred[]>();
const eventIndexCache = new Map<string, number>();
const lastEventCountCache = new Map<string, number>();

export function clearLiveComodinCaches() {
  predCache.clear();
  eventIndexCache.clear();
  lastEventCountCache.clear();
  usedPhrases.clear();
  usedLectures.clear();
  usedRanking.clear();
  usedTaunts.clear();
  usedDebates.clear();
  debateState.retortFor = null;
  debateState.retort = "";
  speakingLock.holder = null;
  speakingLock.until = 0;
  speakingLock.lastSpeaker = null;
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
      {rankingSnapshot && (match.phase === "knockout" || rankingSnapshot.some((r) => r.hasComodinOnActive)) && (
        <>
          <LiveComodinDock scope={match.scope} matchId={match.id} homeTeamId={match.homeTeamId} awayTeamId={match.awayTeamId} liveScore={liveScore} rankingSnapshot={rankingSnapshot} side="right" />
          {(match.id === "R32-3" || match.id === "R32-4") && (
            <LiveComodinDock scope={match.scope} matchId={match.id} homeTeamId={match.homeTeamId} awayTeamId={match.awayTeamId} liveScore={liveScore} rankingSnapshot={rankingSnapshot} useBirthdayVoice side="left" />
          )}
          {DEBATE_MATCH_IDS.includes(match.id) && (
            <LiveComodinDock scope={match.scope} matchId={match.id} homeTeamId={match.homeTeamId} awayTeamId={match.awayTeamId} liveScore={liveScore} rankingSnapshot={rankingSnapshot} guestVoice={DEBATE_GUEST_VOICE} side="left" />
          )}
        </>
      )}
    </div>
  );
}
