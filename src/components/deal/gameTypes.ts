export const AMOUNTS = [
  0.01, 1, 5, 10, 25, 50, 75, 100,
  200, 300, 400, 500, 750, 1_000,
  5_000, 10_000, 25_000, 50_000,
  75_000, 100_000, 200_000, 300_000,
  400_000, 500_000, 750_000, 1_000_000,
];

export const LOW_AMOUNTS = AMOUNTS.slice(0, 13);
export const HIGH_AMOUNTS = AMOUNTS.slice(13);

export const CASES_PER_ROUND = [6, 5, 4, 3, 2, 1, 1, 1, 1];

export const CASE_FLAGS = [
  "ar", "br", "de", "fr", "es", "gb-eng", "it", "pt", "nl", "mx",
  "us", "jp", "kr", "ma", "hr", "uy", "co", "se", "au", "ca",
  "qa", "sa", "ir", "gh", "sn", "ch",
];

export type GamePhase = "pick" | "opening" | "offer" | "final" | "done";

export interface DealState {
  cases: number[];
  caseFlags: string[];
  playerCase: number;
  opened: Set<number>;
  round: number;
  casesLeftThisRound: number;
  phase: GamePhase;
  offer: number;
  finalAmount: number;
  dealTaken: boolean;
  started: boolean;
}

export function formatMoney(amount: number): string {
  if (amount < 1) return "$0,01";
  if (amount >= 1_000_000) return "$1.000.000";
  return "$" + Math.floor(amount).toLocaleString("es-AR");
}

// Banker mood: smug (player is losing), neutral, desperate (big money still alive)
export type BankerMood = "smug" | "neutral" | "desperate";

interface MoodPhrases {
  smug: string[];
  neutral: string[];
  desperate: string[];
}

export interface BankerConfig {
  image: string;
  offerMultiplier: number;
  offer: MoodPhrases;
  noDeal: MoodPhrases;
  deal: MoodPhrases;
}

export function getBankerMood(state: DealState, offerHistory: number[]): BankerMood {
  const remaining = state.cases.filter((_, i) => !state.opened.has(i));
  const bigLeft = remaining.filter((v) => v >= 100_000).length;
  const maxLeft = Math.max(...remaining);

  // Offer dropped hard → banker is smug (player just killed big values)
  if (offerHistory.length >= 2) {
    const prev = offerHistory[offerHistory.length - 2];
    const curr = state.offer;
    if (prev > 0 && curr < prev * 0.6) return "smug";
    if (prev > 0 && curr > prev * 1.5) return "desperate";
  }

  // No big values left → banker is relaxed
  if (bigLeft === 0) return "smug";
  if (maxLeft < 50_000) return "smug";

  // Late game with big money still alive → banker is sweating
  if (remaining.length <= 4 && bigLeft >= 1) return "desperate";
  if (bigLeft >= 3) return "desperate";
  if (maxLeft >= 500_000 && remaining.length <= 6) return "desperate";

  return "neutral";
}

export function createPhraseTracker() {
  const used = new Set<string>();
  return function pick(phrases: string[]): string {
    const fresh = phrases.filter((p) => !used.has(p));
    const pool = fresh.length > 0 ? fresh : phrases;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    used.add(chosen);
    return chosen;
  };
}

export const BANKERS: BankerConfig[] = [
  // Chiqui — passive-aggressive DT energy, skims off the top
  {
    image: "/images/comodin-fecha-1.jpg",
    offerMultiplier: 0.90,
    offer: {
      smug: [
        "Tomá, comprá unos chicles...",
        "Después de lo que abriste, agradecé que te ofrezco algo",
        "Perdiste todo lo bueno, pibe... esto es lo que queda",
        "Con lo que abriste, yo ni te ofrecía",
        "La oferta era más alta pero tuve gastos...",
        "Mirá, es poco, pero el presupuesto es el presupuesto",
        "Te comiste los mejores maletines, tomá lo que hay",
        "Había más pero hubo que pagar unas cuentas...",
        "La oferta es chica como tu suerte hoy",
        "Esto es caridad a esta altura, ¿eh?",
      ],
      neutral: [
        "Pensalo bien, pibe...",
        "¿Seguro que querés seguir? Yo que vos agarro",
        "Esta oferta no va a durar... ya me estoy arrepintiendo",
        "Oferta justa, bueno, casi justa... decisión tuya",
        "El banquero puso lo que pudo, yo me quedé una comisión nomás",
        "Ni mucho ni poco, pero es lo que hay después de mis gastos",
        "¿Qué te dice el instinto, pibe?",
        "Hay plata en la mesa... no tanta como había antes, pero hay",
        "A veces lo seguro es lo inteligente, y esto es casi seguro",
        "El número es bueno, confía en el Chiqui",
      ],
      desperate: [
        "¡Te estoy dando casi todo, no seas terco!",
        "¡Agarrá la plata antes de que me quede con algo más!",
        "Yo que vos agarro y me voy a la cancha tranquilo",
        "¡Me quedé con lo mínimo, pibe, el resto es tuyo!",
        "¡No me hagas esto, llevate la guita antes de que la repiense!",
        "Esta oferta me la van a cobrar a mí, ¡agarrala!",
        "¡Mirá lo que te estoy dando! Bueno, casi todo...",
        "Ni Gallardo rechazaría esta oferta",
        "¡Mirá ese número! ¡Agarrá y corré antes de que lo baje!",
        "Me tiembla la mano de lo generoso que estoy siendo",
      ],
    },
    noDeal: {
      smug: [
        "Bueno, es tu problema...",
        "Dale, seguí regalando plata",
        "Yo ya gané, pero seguí jugando",
        "No me preocupa para nada, pibe",
        "Seguí, seguí... total lo bueno ya se fue",
        "Me quedo tranquilo acá tomando mate",
        "Era esperable, no tenías mucho que perder",
        "Bueno, qué querés que te diga... suerte",
        "No me mueve un pelo tu decisión",
        "Seguí abriendo, total ya no queda nada bueno",
      ],
      neutral: [
        "Después no vengas a llorar...",
        "¡Qué atrevido!",
        "Le voy a decir a Conmebol...",
        "Bueno, vamos a ver qué pasa...",
        "Interesante decisión, ya veremos",
        "Ojalá no te arrepientas, pibe",
        "El partido todavía no terminó",
        "Seguimos entonces, sin rencores",
        "Bancátela si sale mal, ¿eh?",
        "Tu decisión, tu responsabilidad",
      ],
      desperate: [
        "¡Estás loco, pibe! ¡LOCO!",
        "¡Te vas a arrepentir toda la vida!",
        "¡No puedo creer que rechazaste eso!",
        "¡¿Qué te pasa?! ¡Era una FORTUNA!",
        "¡Ni Messi tiene esa sangre fría!",
        "¡Le voy a contar a todo el mundo lo que hiciste!",
        "¡Me va a dar algo! ¡Rechazó TODO!",
        "¡Sos el jugador más temerario que vi en mi vida!",
        "¡Estoy temblando! ¡No lo puedo creer!",
        "¡Esto es una locura total, TOTAL!",
      ],
    },
    deal: {
      smug: [
        "Bueno, algo es algo...",
        "Al menos no te vas con las manos vacías",
        "Zafaste justo a tiempo",
        "Decisión inteligente dado lo que quedaba",
        "Te salvaste de un papelón, pibe",
        "Agarraste lo que pudiste, bien ahí",
        "Podría haber sido peor, ¿no?",
        "El banquero te hizo un favor hoy",
      ],
      neutral: [
        "Bien jugado, pibe",
        "Me sacaste plata...",
        "¡Te llevás una buena!",
        "Decisión inteligente, te felicito",
        "Buen deal, no hay mucho más que decir",
        "Ni mal ni bien, pero te vas con plata",
        "Deal cerrado, a disfrutar",
        "Te llevás una linda suma, pibe",
      ],
      desperate: [
        "¡Me arruinaste el presupuesto!",
        "¡No puedo creer que te llevás eso!",
        "¡Te vas con un golazo de media cancha!",
        "¡Me dejaste en la lona, pibe!",
        "¡Jugaste como un crack del deal!",
        "¡Esa plata me la van a descontar a mí!",
        "¡Increíble! ¡Te llevás una fortuna!",
        "¡Me hiciste transpirar la camisa entera!",
      ],
    },
  },
  // Pollo Vignolo — generous showman, wants big moments
  {
    image: "/images/comodin-fecha-2.jpg",
    offerMultiplier: 1.10,
    offer: {
      smug: [
        "Bueno, bajó la oferta, pero el banquero fue generoso igual...",
        "Los grandes se fueron pero la oferta no está mal para lo que queda",
        "El banquero puso más de lo esperado, hay que reconocerlo",
        "Oferta decente considerando el panorama, ¿no señores?",
        "El banquero está cómodo pero no fue mezquino",
        "Se fueron los pesos pesados pero la oferta acompaña",
        "La tensión bajó pero el banquero no se achicó",
        "No hay mucho misterio pero la plata está ahí",
        "El banquero respira tranquilo y ofrece bien",
        "Oferta justa para un tablero complicado, hay que decirlo",
      ],
      neutral: [
        "¡MIRÁ ESE NÚMERO! ¡El banquero vino generoso!",
        "¡EL BANQUERO NO SE ANDA CON VUELTAS! ¡Tiró todo!",
        "¡BUENA OFERTA señores! ¡MUY buena!",
        "¡Interesante propuesta! ¡Más de lo que esperaba!",
        "¡Número importante en la mesa! ¡El banquero aflojó!",
        "¡Hay plata sobre la mesa señores! ¡Y mucha!",
        "¡El banquero vino a regalar plata hoy!",
        "¡Oferta seria, generosísima!",
        "¡El banquero abrió la billetera de par en par!",
        "¡Esto se pone lindo! ¡La oferta es un golazo!",
      ],
      desperate: [
        "¡¡INCREÍBLE LA OFERTA SEÑORES!! ¡¡ES UN REGALO!!",
        "¡¡EL BANQUERO DIO TODO, NO SE GUARDÓ NADA!!",
        "¡¡TIRÓ TODA LA CARNE AL ASADOR Y EL POSTRE TAMBIÉN!!",
        "¡¡SEÑORES, NUNCA VI TANTA GENEROSIDAD!!",
        "¡¡EL BANQUERO REGALÓ LA CASA!!",
        "¡¡ESTO ES HISTÓRICO! ¡¡LA OFERTA MÁS GENEROSA QUE VI!!",
        "¡¡PUSO MÁS DE LO QUE DEBÍA, ABSOLUTAMENTE TODO!!",
        "¡¡EL BANQUERO SE ARRUINÓ SOLITO!!",
        "¡¡ME TIEMBLA EL MICRÓFONO DE LA EMOCIÓN!!",
        "¡¡ESTÁN VIENDO ESTA LOCURA?! ¡¡REGALÓ TODO!!",
      ],
    },
    noDeal: {
      smug: [
        "Sigue el juego, tranquilamente...",
        "No había mucho en juego la verdad",
        "Era poca plata, bien en seguir",
        "Nada que lamentar, era poquito",
        "El jugador no se inmuta, y tiene razón",
        "Decisión fácil, no había mucho que perder",
        "Sigue tranquilo, como tiene que ser",
        "Sin drama, a la siguiente ronda",
        "Ni se despeinó para rechazar eso",
        "No deal sin suspenso, señores",
      ],
      neutral: [
        "¡RECHAZÓ LA OFERTA señores!",
        "¡QUÉ CORAJE!",
        "¡TIENE SANGRE FRÍA!",
        "¡NO DEAL, seguimos!",
        "¡Se planta firme el jugador!",
        "¡Decidió seguir, hay huevos!",
        "¡No le tembló el pulso!",
        "¡Rechazó y sigue para adelante!",
        "¡El jugador confía en su maletín!",
        "¡No deal! ¡Esto sigue señores!",
      ],
      desperate: [
        "¡¡NO LO PUEDO CREER SEÑORES!!",
        "¡¡RECHAZÓ UNA FORTUNA, ESTÁ LOCO!!",
        "¡¡TIENE HIELO EN LAS VENAS!!",
        "¡¡ESTO ES DE LOCOS, DE LOCOS!!",
        "¡¡DIJO QUE NO A ESA MONTAÑA DE PLATA!!",
        "¡¡EL BANQUERO NO LO PUEDE CREER!!",
        "¡¡SEÑORES, ESTO NO SE VE TODOS LOS DÍAS!!",
        "¡¡QUÉ JUGADOR, QUÉ TEMPERAMENTO!!",
        "¡¡ME QUEDO SIN VOZ SEÑORES!!",
        "¡¡RECHAZÓ MÁS PLATA QUE MI SUELDO ANUAL!!",
      ],
    },
    deal: {
      smug: [
        "Bueno, deal, chau, se fue tranquilo",
        "Se va con algo, no está mal",
        "Deal sin drama, bien ahí",
        "Se lleva lo justo, nada más",
        "Deal tranquilo, sin sobresaltos",
        "Cierra el trato sin mucha emoción",
        "Se va calladito con su platita",
        "Deal modesto pero deal al fin",
      ],
      neutral: [
        "¡DEAL señores, DEAL!",
        "¡SE LLEVÓ LA PLATA!",
        "¡QUÉ MOMENTO!",
        "¡CERRÓ EL TRATO!",
        "¡DEAL! ¡Bien jugado!",
        "¡Se lleva una linda suma señores!",
        "¡Trato hecho! ¡Buena decisión!",
        "¡El jugador cierra con inteligencia!",
      ],
      desperate: [
        "¡¡DEAL HISTÓRICO SEÑORES!!",
        "¡¡SE VA CON UNA FORTUNA!!",
        "¡¡ESTO VA A LOS LIBROS DE HISTORIA!!",
        "¡¡QUÉ DEAL, QUÉ DEAL, QUÉ DEEEEAL!!",
        "¡¡SE LLEVA UNA MONTAÑA DE PLATA!!",
        "¡¡EL BANQUERO ESTÁ LLORANDO!!",
        "¡¡DEAL MILLONARIO SEÑORES!!",
        "¡¡APLAUSOS DE PIE PARA ESTE JUGADOR!!",
      ],
    },
  },
  // Trump — cheap dealmaker, always lowballs
  {
    image: "/images/comodin-fecha-3.jpg",
    offerMultiplier: 0.85,
    offer: {
      smug: [
        "You blew up the big ones, amigo. Lucky I'm offering anything",
        "Not my best offer, but honestly it's more than you deserve",
        "Sad! You had great cases and you opened them. I'm being nice here",
        "I've seen better players, but I'm still being generous, believe me",
        "This offer is small because YOU made it small, not me",
        "Even my interns make better choices, but I'm still paying you",
        "You destroyed your own cases, be thankful I'm offering at all",
        "I'm being TOO generous considering your performance, muy generoso",
        "This is what happens when you don't listen to Trump. Take it",
        "Terrible strategy, but Trump is still giving you a great deal",
      ],
      neutral: [
        "This is an incredible offer, probably too much honestly",
        "Nobody gives more than Trump! ¡Nadie da más que yo!",
        "This is tremendously generous, I'm basically losing money here",
        "I think you should take it, you won't get better, créeme",
        "Fair offer? This is MORE than fair, it's Trump-fair",
        "The art of the deal, amigo — and this is a masterpiece",
        "I'm practically giving it away, you should thank me",
        "Good offer, great offer, maybe the best offer ever",
        "I'm being too reasonable, my advisors would be furious",
        "Take it, believe me, nobody else would offer this much",
      ],
      desperate: [
        "This is the MOST GENEROUS offer in history! I'm losing EVERYTHING!",
        "Take this deal, I'm giving you way too much, absolutamente loco!",
        "I'm losing money here and I NEVER lose money!",
        "¡Por favor! I'm overpaying! My accountant will kill me!",
        "This offer is YUGE! Too yuge! I need to stop being so generous!",
        "I'm basically bankrupt after this offer, take it before I cry!",
        "Even I can't believe how much I'm giving you, and I'm ME!",
        "Take it! TAKE IT! I've never been this generous, ¡jamás!",
        "I'm sweating from my own generosity, and Trumps don't sweat!",
        "This is charity at this point, pura caridad, take the deal!",
      ],
    },
    noDeal: {
      smug: [
        "Fine, whatever, you have nothing left anyway",
        "Keep going, I don't care, I'm still rich",
        "Not a big deal... literally, pun intended",
        "Okay amigo, your loss, literalmente tu pérdida",
        "I wouldn't have taken that either, too small for Trump",
        "Smart, but only because the offer was small anyway",
        "Good, more money stays in MY pocket",
        "No deal on a small offer? Even I agree, sí señor",
        "Whatever, I've got bigger deals to make",
        "Pfft, that was pocket change, sigue jugando",
      ],
      neutral: [
        "Bad decision! Very bad!",
        "I'll be back with less!",
        "Nobody says no to me!",
        "Interesting... wrong, but interesting",
        "You're playing a dangerous game, amigo peligroso",
        "We'll see, we'll see... ya veremos",
        "Bold move, maybe stupid, maybe genius, quién sabe",
        "I respect the courage, not the intelligence",
        "Okay okay, but remember I warned you",
        "Your choice, tu decisión, don't blame Trump later",
      ],
      desperate: [
        "You're FIRED! Wait, wrong show... but still!",
        "This is the worst decision since... many things, believe me!",
        "¡Estás completamente LOCO, amigo!",
        "I've never seen anything like this! ¡Nunca, NUNCA!",
        "My jaw is on the floor, en el PISO!",
        "You just said no to MORE MONEY than most people ever see!",
        "¡DIOS MÍO! You're either a genius or completamente loco!",
        "I need to sit down, necesito sentarme, this is INSANE!",
        "Call a doctor, this person is CRAZY! ¡Está loco!",
        "In fifty years of deals I've NEVER seen this, jamás!",
      ],
    },
    deal: {
      smug: [
        "Okay, small deal, still a deal",
        "You took what you could get, smart-ish",
        "At least you didn't leave empty-handed, amigo",
        "Wise choice given the circumstances, supongo",
        "Small potatoes, but hey, potatoes are food",
        "Good enough, I guess, supongo que sí",
        "You survived, barely, apenas sobreviviste",
        "Not the best deal, but better than nothing, algo es algo",
      ],
      neutral: [
        "Good negotiation!",
        "Smart move, very smart!",
        "I respect that decision!",
        "Deal! Trato hecho, amigo!",
        "Not bad, not bad at all, nada mal",
        "You played well, jugaste bien, I'll give you that",
        "Solid deal, very solid, like my buildings",
        "I approve this deal, and my approval means everything",
      ],
      desperate: [
        "TREMENDOUS deal, the biggest!",
        "You negotiated like a true champion, like me!",
        "¡Increíble! You're almost as good at deals as I am!",
        "I'm ruined! ¡Estoy arruinado! You took everything!",
        "Greatest deal I've ever seen, and I've seen many, MUCHOS!",
        "You're hired! Wait... you just took all my money!",
        "Call Forbes, tell them this person is a GENIUS!",
        "¡Dios mío! You cleaned me out, me dejaste en la calle!",
      ],
    },
  },
  // Knockout comodines — add images and mood phrases when ready
];
