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
      BRA: ["Miren el rostro de Vini Jr. Yo siempre sostuve que los brasileños salieron de la selva.", "Les doy un dato que usaba en la facultad: Brasil es el único país que jugó todos los mundiales. Presencia perfecta. La mía en el Congreso era otra cosa"],
      JPN: ["En Japón los hinchas limpian el estadio después del partido. Si hicieran eso acá, el estadio estaría más limpio que mi expediente", "Dato de mi cátedra de derecho: en Japón hay más de 5 millones de máquinas expendedoras. Una cada 23 personas. Más accesibles que un ministro mío"],
      GER: ["Los alemanes tienen la Oktoberfest, yo la Olivosfest. No debió haberse hecho, Fabiola...", "Los alemanes son famosos por ser puntuales. Yo era puntual para las clases en la UBA, no para las reuniones de gabinete"],
      PAR: ["Como dijo el Profesor Alfaro, este partido es un parto de nalga.", "Los paraguayos vienen de la obras...en Devoto está repleto.", "Los guaraníes son uno de los pueblos originarios más orgullosos. Paraguay tiene dos idiomas oficiales: español y guaraní. Más bilingüe que mi doble discurso"],
      NED: ["Holanda está un tercio bajo el nivel del mar. Aun así no se hunden. A mi me hundió la pandemia, la sequía y Macri.", "Dato que daba en la UBA: Holanda es el mayor exportador de flores del mundo. Yo también repartía flores... a Cristina, para que no se enoje"],
      MAR: ["Por culpa de Marruecos no clasificó Escocia...qué ganas de un whisky", "Marruecos tiene el desierto del Sahara. Más seco que mi relación con Cristina al final del mandato"],
      CIV: ["Yo que estudié derecho y enseñé en la UBA les cuento: Costa de Marfil es el mayor productor de cacao del mundo. Sin ellos no hay chocolate", "Didier Drogba es el máximo goleador histórico de Costa de Marfil. Un crack. Lástima que no jugó para nosotros"],
      NOR: ["Noruega tiene el fondo soberano más grande del mundo. 1.4 billones de dólares. Nosotros teníamos... el ANSES", "Les cuento como profesor: Noruega tiene más fiordos que yo excusas para la inflación. Y miren que yo tenía muchas"],
      FRA: ["La Torre Eiffel iba a ser temporal. Como mi presidencia... bueno, esa sí fue temporal", "En mi cátedra siempre decía: los franceses consumen 25 mil toneladas de queso por año. Más agujeros que mi plan económico"],
      SWE: ["Qué mal está manejando Suecia el partido, igual que con la pandemia.", "Suecia inventó IKEA. Yo también armé un gabinete con instrucciones confusas y sobraron piezas."],
      MEX: ["Se nota que los mexicanos salieron de los indios...", "Dato que enseño en clase: los mexicanos inventaron el chocolate caliente. Sin los aztecas no hay submarino"],
      ECU: ["Ecuador se llama así por la línea del ecuador que lo cruza. Dato que parece obvio pero mis alumnos de la UBA no lo sabían", "Las Islas Galápagos son de Ecuador. Darwin desarrolló su teoría ahí. Yo desarrollé mis teorías en Olivos, con menos éxito"],
      ENG: ["Yo que enseñé 20 años en la UBA les cuento: Inglaterra inventó el fútbol en 1863 pero solo ganó un mundial. En 1966. De local. Con un gol fantasma", "La Premier League es la liga más vista del mundo. Más audiencia que mis cadenas nacionales, seguro", "Los ingleses toman té a las 5. Nosotros tomamos mate todo el día. Somos más constantes"],
      COD: ["El Congo tiene el río Congo, el más profundo del mundo. 220 metros. Más profunda que la crisis económica que heredamos...", "Dato de mi cátedra: la República Democrática del Congo es el país más grande de África subsahariana. Grande como mi sueño de ser recordado como buen presidente"],
      USA: ["¡Despertate, Donald! Ya lo hiciste con Macri, con Milei y ahora con Infantino.", "Este partido está intervenido por el FMI, lo lamento por los bosnios."],
      BIH: ["Bosnia tiene el puente de Mostar, reconstruido después de la guerra. Símbolo de reconciliación. Algo que yo con Cristina nunca logré", "En la UBA siempre hablaba de los Balcanes: el café bosnio se sirve en un džezva. Es como el café turco pero te lo explican con más historia"],
      BEL: ["Bélgica tiene más de 1.500 tipos de cerveza. Pero como la que me tomé con L-gante no hay.", "Esto se lo enseño a todos mis alumnos: los belgas inventaron las papas fritas. No los franceses. Nadie me cree", "Bélgica tiene 3 idiomas oficiales: francés, neerlandés y alemán. Un quilombo administrativo, pero menos que el nuestro"],
      SEN: ["Senegal ganó la Copa Africana en 2022. El mismo año que Argentina ganó el mundial. Buen año para el fútbol", "Les cuento como docente: el rally Dakar se llamaba así por la capital de Senegal, aunque ya no pasa por ahí. Como yo y la Rosada"],
      POR: ["Cristiano Ronaldo es portugués y tiene más de 900 goles. Más productivo que todo mi gabinete junto", "Dato que usaba en mis clases de la UBA: Portugal descubrió Brasil en 1500. Quinientos años después, Brasil los elimina en los mundiales. La historia tiene ironías"],
      CRO: ["Croacia tiene 4 millones de habitantes y fue finalista en 2018 y semifinalista en 2022. Per cápita, la mejor selección del mundo", "Les enseño algo: la corbata es invento croata. Cravat viene de 'croata'. Qué lindas son las croatas."],
      ESP: ["España ganó el mundial 2010 con el tiki-tiki. 800 pases por partido. Como mi querido Argentinos Juniors. Polo y Chekoloko no me van a dejar mentir.", "En mi cátedra siempre tiraba este dato: España tiene más bares per cápita que cualquier país europeo. Un verdadero paraíso."],
      AUT: ["Como buen profesor les cuento: Austria nos dio a Mozart, Freud y el strudel. Tres contribuciones fundamentales a la humanidad", "Austria y Australia se confunden todo el tiempo. En Austria no hay canguros. En Australia no hay schnitzel... bueno, tal vez sí"],
      ARG: ["Muy a mi pesar, Argentina no saldrá campeón porque yo ya no soy presidente.", "45 millones de directores técnicos. Dato oficial. Yo que soy profesor de la UBA también opino de táctica pero nadie me pide consejo", "Les doy una clase gratis: Argentina es el octavo país más grande del mundo. En superficie. En problemas económicos somos top 3."],
      CPV: ["Dato para mis alumnos: Cabo Verde tiene 10 islas volcánicas. Medio millón de habitantes. Es la selección más chica de este mundial", "El morna, la música de Cabo Verde, es patrimonio de la humanidad. Cesária Évora la hizo famosa. Cultura, señores, cultura"],
      AUS: ["Australia tiene más canguros que personas. 50 millones contra 26 millones. Dato que siempre impresiona cuando lo doy en clase", "Dato de profesor: los australianos llaman 'football' al rugby y al fútbol le dicen 'soccer'. Un desastre lingüístico, como mi comunicación política"],
      EGY: ["Yo que enseñé derecho en la UBA les digo: Egipto tiene las pirámides que tienen 4.500 años. Más estables que la economía argentina. Mucho más", "Egipto tiene a Mohamed Salah y nosotros a Milagro Sala. Hemos sido beneficiados."],
      SUI: ["Suiza tiene más bancos que canchas de fútbol. Y más secretos bancarios que yo secretos de Estado...", "Los suizos son neutrales desde 1815. Yo intenté ser neutral entre Cristina y Macri y no me salió"],
      ALG: ["Dato que siempre doy en la facultad: Argelia es el país más grande de África. Más grande que la deuda externa... no, la deuda es más grande.", "Argelia ganó la Copa Africana en 2019 con Belmadi. Un técnico que sabe delegar. Yo no, yo quería hacer todo"],
      COL: ["Colombia tiene la biodiversidad de aves más grande del mundo. Más de 1.900 especies. Dato de National Geographic que uso en mis clases", "Les cuento como profesor: el café colombiano es de los mejores del mundo. Mucho mejor que el café del Congreso, que era horrible"],
      GHA: ["Dato de mi cátedra: Ghana fue el primer país de África subsahariana en independizarse, en 1957. Importante para el derecho internacional", "El 8 de Ghana se llama Sibo. Yo también tengo Sibo, pobre Fabiola."],
    },
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

  const isHalftime = score.status === "HT" || score.status === "BT";

  // During halftime: lectures dominate, some idle, occasional prediction banter
  if (isHalftime) {
    if (voice.lecture && Math.random() < 0.6) {
      const teamIds = [homeTeamId, awayTeamId].filter(Boolean) as string[];
      const tid = teamIds.length > 0 ? pick(teamIds) : null;
      if (tid && voice.lecture[tid]?.length) {
        return { phrase: pick(voice.lecture[tid]), newEventIndex: lastEventIndex };
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

  // 80% — Professor lecture (temporarily bumped for testing)
  if (roll < 0.80 && voice.lecture) {
    const teamIds = [homeTeamId, awayTeamId].filter(Boolean) as string[];
    const tid = teamIds.length > 0 ? pick(teamIds) : null;
    if (tid && voice.lecture[tid]?.length) {
      return { phrase: pick(voice.lecture[tid]), newEventIndex: lastEventIndex };
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

  // 10% — Ranking commentary
  if (roll < 0.7 && ranking && ranking.length > 0) {
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
      if (right.length === 0) return { phrase: voice.nobodyRight(), newEventIndex: lastEventIndex };
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

function LiveComodinDock({ scope, matchId, homeTeamId, awayTeamId, liveScore, rankingSnapshot }: { scope: string; matchId: string; homeTeamId: string | null; awayTeamId: string | null; liveScore: LiveScore; rankingSnapshot?: RankingSnapshotEntry[] }) {
  const config = getComodinConfig(scope);
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

    function showPhrase(text: string, durationMs?: number) {
      const ms = durationMs ?? phraseDuration(text);
      isShowingRef.current = true;
      setPhrase(text);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        isShowingRef.current = false;
        if (eventQueue.current.length > 0) {
          const next = eventQueue.current.shift()!;
          setTimeout(() => showPhrase(next), 1500);
        }
      }, ms);
    }

    function checkEvents() {
      const events = liveScoreRef.current.events ?? [];
      // Generate phrases for ALL new events
      while (events.length > lastEventCount.current) {
        const result = generateDynamicPhrase(liveScoreRef.current, predsRef.current, scope, eventIndexRef.current, rankingRef.current, homeTeamId, awayTeamId);
        eventIndexRef.current = result.newEventIndex;
        lastEventCount.current = Math.max(lastEventCount.current + 1, result.newEventIndex);
        eventQueue.current.push(result.phrase);
      }
      // Show first queued event if not already showing
      if (!isShowingRef.current && eventQueue.current.length > 0) {
        const next = eventQueue.current.shift()!;
        showPhrase(next);
      }
    }

    function showIdle() {
      if (isShowingRef.current || eventQueue.current.length > 0) return;
      const result = generateDynamicPhrase(liveScoreRef.current, predsRef.current, scope, eventIndexRef.current, rankingRef.current);
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
        <LiveComodinDock scope={match.scope} matchId={match.id} homeTeamId={match.homeTeamId} awayTeamId={match.awayTeamId} liveScore={liveScore} rankingSnapshot={rankingSnapshot} />
      )}
    </div>
  );
}
