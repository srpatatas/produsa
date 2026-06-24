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
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

const VOICES: Record<string, PersonalityVoice> = {
  "fecha-1": { // Chiqui
    goal: (s, m, _side, h, a) => pick([
      `Gol de ${s} en el minuto ${m}. ${h}-${a}. Yo lo hubiese anulado`,
      `¡${s} la metió! ${h}-${a}. La FIFA va a revisar esto`,
      `${s}, minuto ${m}. Le voy a avisar a Conmebol que hay gol`,
    ]),
    ownGoal: (s, m) => `En contra de ${s} en el ${m}'. Esto es un escándalo para la FIFA`,
    redCard: (p, m) => pick([`¡Roja para ${p} en el ${m}'! Yo lo hubiese expulsado antes`, `${p} se va expulsado. Le mando un fax de despedida`]),
    yellowCard: (p, m) => pick([`Amarilla para ${p} en el ${m}'. La AFA toma nota`, `${p} amonestado. Ojo que la próxima lo suspendo yo`]),
    penalty: (s, m) => `¡Penal de ${s} en el ${m}'! Esto lo reviso con la FIFA`,
    scoreless: (m) => pick([`${m} minutos y 0-0... esto no lo aprueba nadie`, `¿No piensan meter un gol? Le voy a avisar al árbitro`]),
    lateGame: (h, a) => pick([`Últimos minutos, ${h}-${a}. Voy a llamar al VAR por las dudas`, `Se termina esto. ${h}-${a}. La AFA se pronunciará`]),
    comodinWinning: (n, h, a) => pick([`${n} puso el comodín y va ${h}-${a}... la AFA aprueba`, `¡${n} se frota las manos con ese +2!`]),
    comodinLosing: (n, h, a) => pick([`${n} puso el comodín con el ${h}-${a}... le mando un telegrama de pésame`, `El comodín de ${n} es un escándalo con este resultado`]),
    comodinExactHit: (n, h, a) => `¡${n} CLAVÓ el ${h}-${a}! ¿Tiene contacto con la FIFA?`,
    nobodyRight: () => "¡Casi nadie le pegó! Voy a investigar esto",
    fewRight: (names) => `Solo ${names} le están pegando, los demás... al banco`,
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
  },
  "fecha-2": { // Pollo
    goal: (s, m, _side, h, a) => pick([
      `¡¡GOOOOOL DE ${s.toUpperCase()} EN EL ${m}'!! ¡¡${h}-${a} SEÑORES!!`,
      `¡¡LA METIÓ ${s.toUpperCase()}!! ¡¡${h}-${a}!! ¡¡ESTO ES INCREÍBLE!!`,
      `¡¡${s.toUpperCase()}, MINUTO ${m}!! ¡¡${h}-${a}!! ¡¡QUÉ PARTIDAZO!!`,
    ]),
    ownGoal: (s, m) => `¡¡EN CONTRA DE ${s.toUpperCase()} EN EL ${m}'!! ¡¡MAMITA QUERIDA!!`,
    redCard: (p, m) => pick([`¡¡ROJA PARA ${p.toUpperCase()} EN EL ${m}'!! ¡¡SE VA SEÑORES!!`, `¡¡EXPULSADO ${p.toUpperCase()}!! ¡¡ESTO SE PONE PICANTE!!`]),
    yellowCard: (p, m) => `¡AMARILLA PARA ${p.toUpperCase()} EN EL ${m}'! ¡OJO QUE LA PRÓXIMA SE VA!`,
    penalty: (s, m) => `¡¡PENAL DE ${s.toUpperCase()} EN EL ${m}'!! ¡¡SEÑOOOORES!!`,
    scoreless: (m) => pick([`¡¡${m} MINUTOS Y NO HAY GOLES SEÑORES!!`, `¡¡ESTO NO SE ABRE!! ¡¡INCREÍBLE!!`]),
    lateGame: (h, a) => `¡¡ÚLTIMOS MINUTOS!! ¡¡${h}-${a}!! ¡¡SE DEFINE SEÑORES!!`,
    comodinWinning: (n, h, a) => pick([`¡¡${n.toUpperCase()} CON EL COMODÍN Y VA ${h}-${a}!! ¡¡QUÉ GENIO!!`, `¡¡${n.toUpperCase()} SE FROTA LAS MANOS SEÑORES!!`]),
    comodinLosing: (n, h, a) => pick([`¡¡EL COMODÍN DE ${n.toUpperCase()} LLORA CON ESTE ${h}-${a}!!`, `¡¡${n.toUpperCase()} LA ESTÁ PASANDO MAL!!`]),
    comodinExactHit: (n, h, a) => `¡¡${n.toUpperCase()} CLAVÓ EL ${h}-${a}!! ¡¡INCREÍBLE SEÑORES!!`,
    nobodyRight: () => "¡¡CASI NADIE LE PEGÓ SEÑORES!! ¡¡QUÉ PARTIDO!!",
    fewRight: (names) => `¡¡SOLO ${names.toUpperCase()} LE ESTÁN PEGANDO!! ¡¡EL RESTO A LLORAR!!`,
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
  },
  "fecha-3": { // Trump
    goal: (s, m, _side, h, a) => pick([
      `Goal by ${s}, minute ${m}. ${h}-${a}. Tremendous goal, believe me!`,
      `${s} scored! ${h}-${a}! Almost as good as my goals, amigo`,
      `¡Gol de ${s} en el ${m}'! ${h}-${a}. I predicted this, nobody predicts like me`,
    ]),
    ownGoal: (s, m) => `Own goal by ${s} in minute ${m}? ¡Qué desastre! You're fired, ${s}!`,
    redCard: (p, m) => pick([`Red card for ${p} in minute ${m}! You're fired!`, `${p} expelled! Sad! Very unfair!`]),
    yellowCard: (p, m) => `Yellow card for ${p}, minute ${m}. I would have given red, believe me`,
    penalty: (s, m) => `Penalty by ${s} in the ${m}'! ¡Penal, amigos!`,
    scoreless: (m) => pick([`${m} minutes, 0-0? This is very boring, muy aburrido`, `Nobody is scoring! I could score faster, believe me`]),
    lateGame: (h, a) => `Last minutes! ${h}-${a}. More dramatic than election night!`,
    comodinWinning: (n, h, a) => pick([`${n} put the comodín and it's ${h}-${a}! Smart, very smart!`, `${n} is making Produsa great again!`]),
    comodinLosing: (n, h, a) => pick([`${n} put the comodín here with ${h}-${a}? Bad decision! Sad!`, `The comodín of ${n} is crying. Very sad, muy triste`]),
    comodinExactHit: (n, h, a) => `${n} nailed ${h}-${a}! Almost as smart as me, believe me!`,
    nobodyRight: () => "Nobody predicted this! Not even Trump, and I'm the best predictor",
    fewRight: (names) => `Only ${names} got it right. The rest? You're fired!`,
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
  },
  "R32": { // Albertito
    goal: (s, m, _side, h, a) => pick([
      `Gol de ${s} en el ${m}'. ${h}-${a}. Yo me enteré por zoom`,
      `¡${s} la metió! ${h}-${a}. Guardo conmigo el dolor o la alegría, no sé cuál`,
      `${s}, minuto ${m}. ${h}-${a}. La culpa de este resultado es de Macri`,
      `¡Gol! ${s} en el ${m}'. Esto es como mi gestión: impredecible`,
    ]),
    ownGoal: (s, m) => `En contra de ${s} en el ${m}'. Más autogol que mi candidatura`,
    redCard: (p, m) => pick([`Roja para ${p} en el ${m}'. Se va más rápido que yo de Olivos`, `${p} expulsado. Como yo del poder, pero más dignamente`]),
    yellowCard: (p, m) => pick([`Amarilla para ${p} en el ${m}'. Le pasa por no escuchar a Cristina`, `${p} amonestado. Todavía no lo echaron, le va mejor que a mí`]),
    penalty: (s, m) => `¡Penal de ${s} en el ${m}'! Más polémico que la fiesta de Olivos`,
    scoreless: (m) => pick([`${m} minutos y 0-0... esto está más trabado que la economía que dejé`, `¿No piensan meter un gol? Esto es peor que mi gestión`]),
    lateGame: (h, a) => pick([`Últimos minutos, ${h}-${a}. Como los últimos meses en Olivos`, `Se termina esto. ${h}-${a}. Como mi mandato, con más pena que gloria`]),
    comodinWinning: (n, h, a) => pick([`${n} puso el comodín y va ${h}-${a}... yo nunca tuve esa suerte`, `¡${n} con el +2! Ojalá yo hubiera tenido esos puntos de aprobación`]),
    comodinLosing: (n, h, a) => pick([`${n} puso el comodín con el ${h}-${a}... F. Como mi legado`, `El comodín de ${n} llora como el presupuesto nacional`]),
    comodinExactHit: (n, h, a) => `¡${n} CLAVÓ el ${h}-${a}! Más preciso que mis encuestas falsas`,
    nobodyRight: () => "¡Nadie le pegó! Como nadie le pegó a mis predicciones económicas",
    fewRight: (names) => `Solo ${names} le están pegando. Los demás están como mi gabinete: perdidos`,
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
  },
};

function generateDynamicPhrase(
  score: LiveScore,
  preds: ComodinPred[],
  scope: string,
  lastEventIndex: number,
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

  // Priority 5: Taunt a random player (30% chance)
  if (preds.length > 0 && Math.random() < 0.3) {
    const target = pick(preds);
    return { phrase: voice.taunt(target.name), newEventIndex: lastEventIndex };
  }

  // Priority 6: Idle chatter
  return { phrase: voice.idle(), newEventIndex: lastEventIndex };
}

function LiveComodinDock({ scope, matchId, liveScore }: { scope: string; matchId: string; liveScore: LiveScore }) {
  const config = getComodinConfig(scope);
  const [phrase, setPhrase] = useState("");
  const [visible, setVisible] = useState(false);
  const [preds, setPreds] = useState<ComodinPred[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventIndexRef = useRef(0);

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

  useEffect(() => {
    function showNext() {
      const result = generateDynamicPhrase(liveScoreRef.current, predsRef.current, scope, eventIndexRef.current);
      eventIndexRef.current = result.newEventIndex;

      setPhrase(result.phrase);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        // Shorter pause after events, longer for idle
        const hasNewEvents = (liveScoreRef.current.events?.length ?? 0) > eventIndexRef.current;
        const pause = hasNewEvents ? 2000 + Math.random() * 2000 : 5000 + Math.random() * 5000;
        timerRef.current = setTimeout(showNext, pause);
      }, 4000);
    }

    timerRef.current = setTimeout(showNext, 2000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
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

interface LiveScoreboardProps {
  match: UnifiedMatch;
  liveScore: LiveScore;
  stale?: boolean;
}

export function LiveScoreboard({ match, liveScore, stale = false }: LiveScoreboardProps) {
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
      <LiveComodinDock scope={match.scope} matchId={match.id} liveScore={liveScore} />
    </div>
  );
}
