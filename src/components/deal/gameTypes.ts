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
  // Albertito — out-of-touch, blames everyone, Olivos, zoom, Macri
  {
    image: "/images/comodin-R32.jpg",
    offerMultiplier: 0.88,
    offer: {
      smug: [
        "Prefiero perder 10 comodines y no 100.000 puntos...",
        "Después de lo que abriste, guardo conmigo el dolor profundo",
        "Perdiste todo lo bueno... como la economía, pero no es mi culpa",
        "Con lo que abriste, ni ampliando derechos se arregla",
        "La oferta era más alta pero hubo que pagar Olivos...",
        "Mirá, es poco, pero el único responsable soy yo. Bueno, Fabiola también",
        "Te comiste los mejores maletines, como nos comimos las reservas",
        "La oferta es chica como el presupuesto que dejé",
        "No hemos logrado resolver una oferta sólida... pero ampliamos derechos",
        "Esto es caridad a esta altura, como mi gobierno",
        "La oferta era más alta pero Macri nos dejó este desastre...",
      ],
      neutral: [
        "Ofertame algo lindooooo",
        "Alberto Fernández nunca se enamoró de esta oferta. Es el único remedio que hay",
        "Cristina y yo somos lo mismo... y esta oferta también",
        "Por ahí los argentinos necesitábamos esta oferta que nos una",
        "Lo que nos hace ganar no es el mérito, es esta oferta",
        "Esta oferta la veo por zoom desde Olivos...",
        "El resultado me lo informan por zoom desde Balcarce 50",
        "¿Oferta? Yo le digo plan de contingencia",
        "Me da vergüenza que en la Argentina alguien rechace esta oferta",
        "Vamos a ganar la guerra contra la derrota con esta oferta",
        "Si la oferta no te gusta, culpá a la pesada herencia",
        "Estoy muy feliz de estar poniéndole el fin a tu cuenta bancaria",
        "Los mexicanos salieron de los indios, los brasileros de la selva, los argentinos de los barcos... y esta oferta salió del fondo del maletín",
      ],
      desperate: [
        "¡Prefiero darte toda la plata y no 100.000 problemas!",
        "¡Agarrá la plata antes de que Cristina se entere!",
        "¡Esta oferta la pago con la tarjeta de Olivos, total ya estamos!",
        "¡El único responsable de esta oferta soy yo! ¡AGARRALA!",
        "¡Te estoy dando todo! Como cuando prometí bajar la inflación",
        "¡Mirá esa oferta! ¡Ni en Olivos te dan algo así!",
        "¡No me hagas esto! Ya gasté el presupuesto en vos",
        "¡Me da vergüenza lo generoso que estoy siendo!",
        "¡Guardo conmigo el dolor de darte tanta plata!",
        "¡Si rechazás esto le echo la culpa a Cristina!",
      ],
    },
    noDeal: {
      smug: [
        "Bueno, es tu problema... como la inflación fue tu problema",
        "Dale, seguí, total no es mi culpa si perdés",
        "Yo ya gané... bueno, moralmente, como siempre",
        "No me preocupa para nada, estoy mirando por zoom",
        "Seguí, seguí... total después le echo la culpa a otro",
        "Me quedo tranquilo mirando desde Olivos",
        "Algunos miserables dijeron que se podía rechazar, y tenían razón",
        "No me mueve un pelo, como los datos de la economía",
        "Seguí jugando, yo miro desde el castillo",
        "Era esperable, como la derrota del 2023",
      ],
      neutral: [
        "Después no vengas a llorar... como lloramos todos en 2023",
        "Mi querida Fabiola convocó a un rechazo que no debió haberse hecho...",
        "Buscás que nos enfrentemos, pero nunca más vamos a dividirnos",
        "Bueno, vamos a ver qué pasa... como con la inflación",
        "Interesante decisión, ya veremos si no te arrepentís",
        "Ojalá no te arrepientas como yo me arrepentí de varias cosas",
        "El partido todavía no terminó, como mi mandato... ah no, ese sí",
        "Seguimos entonces, sin rencores, como con Cristina",
        "Tu decisión, tu responsabilidad. Yo soy ajeno a esto",
        "Esto es herencia de Macri, yo no tengo nada que ver",
        "El que rechaza no es el que pierde, es el que elige no ganar",
      ],
      desperate: [
        "¡¿QUÉ HICISTE?! ¡Era una FORTUNA! ¡Como el PBI que perdimos!",
        "¡No lo puedo creer! ¡Ni Cristina rechazaría eso!",
        "¡Rechazaste más plata que las reservas del Central!",
        "¡Me va a dar algo! ¡Como cuando vi los números de la inflación!",
        "¡Esto es una locura! ¡Peor que la fiesta de Olivos!",
        "¡NOOO! ¡Guardo conmigo el dolor profundo de este rechazo!",
        "¡Sos más temerario que yo poniendo a Guzmán de ministro!",
        "¡Me da vergüenza que en la Argentina se rechace esta oferta!",
        "¡Algunos miserables dijeron que ibas a aceptar!",
        "¡Prefiero 10% más de pobres y no este rechazo!",
        "¡Esto es culpa de Macri! ¡Todo es culpa de Macri!",
      ],
    },
    deal: {
      smug: [
        "Bueno, algo es algo... como mi gestión",
        "Al menos no te vas con las manos vacías, como el Central",
        "Zafaste justo a tiempo, como yo en 2023",
        "Decisión conservadora, como poner a Alberto de presidente",
        "Te salvaste de un papelón, como yo no me salvé",
        "Agarraste lo que pudiste, muy inteligente",
        "Podría haber sido peor, como mi segundo año de gobierno",
        "El banquero te hizo un favor, como Cristina me hizo a mí... o no",
      ],
      neutral: [
        "Bien jugado, como mi campaña del 2019",
        "Me sacaste plata... como la inflación nos sacó a todos",
        "¡Te llevás una buena! No como la herencia que dejé",
        "Decisión inteligente, no como algunas que tomé yo",
        "Deal cerrado, a disfrutar... yo me voy a Olivos",
        "Te llevás una linda suma, felicitaciones desde el zoom",
        "Buen deal, mejor que cualquier acuerdo con el Fondo",
        "El único responsable de este deal sos vos, y está bien así",
      ],
      desperate: [
        "¡Me arruinaste el presupuesto! ¡Peor que Batakis!",
        "¡No puedo creer que te llevás eso! ¡Ni en Olivos gasto tanto!",
        "¡Te vas con un golazo! ¡Como los que prometí y no metí!",
        "¡Me dejaste en la lona! ¡Como al país!",
        "¡Esa plata me la van a descontar de la jubilación de privilegio!",
        "¡Increíble! ¡Te llevás más que todo el presupuesto de Olivos!",
        "¡Me da vergüenza cuánta plata te llevás!",
        "¡Guardo conmigo el dolor profundo de haberte pagado tanto!",
        "¡Me vaciaste! ¡Peor que lo que hizo Macri con el país!",
      ],
    },
  },
  // El Profe Alfiki — convoluted philosopher, everything is a metaphor
  {
    image: "/images/comodin-R16.jpg",
    offerMultiplier: 0.92,
    offer: {
      smug: [
        "El resultado te da certeza. Y esta oferta te da certeza de que perdiste mucho",
        "Estamos remando en dulce de leche con lo que queda en tus maletines",
        "A medida que vas subiendo, el espacio es cada vez para más poquitos. Y tu plata también",
        "Esto es un parto de nalga. Con dolor y con poco dinero",
        "Los arrepentimientos llegan tarde. Como esta oferta",
        "Cuando veas la sombra de un gigante, fijate bien. Esta oferta es la sombra de un enano",
      ],
      neutral: [
        "Las victorias sirven para reafirmar las convicciones. ¿Cuál es tu convicción con esta oferta?",
        "Hay que bailar la música que te ponen. Y hoy te puse esta oferta",
        "Yo no muero con la mía, vivo con la mía. Y vos, ¿vivís con esta oferta?",
        "Como decía Einstein, es más fácil desactivar un átomo que un preconcepto. El preconcepto es que esta oferta es mala",
        "Maquiavelo decía que hay que ser zorro para conocer las trampas y león para espantar lobos. Esta oferta es el zorro o es el león. Tu trabajo es descubrir cuál",
        "No es lo que parece. Es lo que uno interpreta de lo que parece. Interpretá bien",
        "Lo peor que hay es ser un ni. No seas un ni. Decidí",
        "Sócrates decía que solo sabía que no sabía nada. Yo sé dos cosas: que esta oferta es justa, y que vos no sabés si creerme. Empate filosófico",
        "La manera de crecer es nivelarte para arriba. Esta oferta te nivela... para algún lado",
      ],
      desperate: [
        "¡Fue una mezcla de sangre y utopía armar esta oferta! ¡AGARRALA!",
        "¡Le puse a esta oferta más corazón que Rocky en el quinceavo round! ¡No dejes que suene la campana!",
        "¡Tenemos un corazón que no se rinde! ¡Y una oferta que no se baja!",
        "¡Ulises resistió el canto de las sirenas atado al mástil! ¡Pero vos no sos Ulises y yo canto muy bien! ¡ACEPTÁ!",
        "¡No hay imposibles para quien está dispuesto a recorrer el camino! ¡Y el camino es aceptar!",
        "¡Podremos tener errores, miles de defectos, pero esta oferta no tiene ninguno!",
        "¡Esta oferta nació con fórceps! ¡Me costó sacarla! ¡No me obligues a devolverla a la panza!",
      ],
    },
    noDeal: {
      smug: [
        "Bueno, el fútbol no es lo que parece...",
        "Seguí jugando. Cuando se pone la carreta delante del caballo, es difícil avanzar",
        "El resultado te dará la certeza. Y la certeza va a doler",
        "Esto ya es un parto de nalga para vos",
        "No me sorprende. Los preconceptos son más difíciles de desactivar que un átomo",
      ],
      neutral: [
        "Interesante. Hay que bailar la música que te ponen. Seguí bailando",
        "El resistir está grabado en tu cédula de identidad, por lo que veo",
        "Yo no muero con la mía, vivo con la mía. Vos parece que morís con la tuya",
        "Los arrepentimientos llegan tarde. Ojalá no sea tu caso",
        "El camino del cazador de utopías es largo. Seguí cazando",
        "No es el final. Es el principio del final del principio",
      ],
      desperate: [
        "¡¿QUÉ?! ¡Éramos Bruce Willis! ¡Y vos mataste a Bruce Willis!",
        "¡Esto es una locura! ¡Es más difícil entenderte que desactivar un átomo!",
        "¡Podremos tener errores, pero esto no es un error, es un desastre!",
        "¡Me da vergüenza! ¡Cuando me pasan todas juntas digo por qué hablo tanto!",
        "¡Rechazaste la utopía! ¡Ya no sos cazador de nada!",
        "¡El corazón no se entrega, pero esa oferta sí se entregaba! ¡Y la rechazaste!",
      ],
    },
    deal: {
      smug: [
        "Bueno, viniste de la tierra colorada y te vas con lo puesto. Es coherente",
        "El resultado te da certeza. Y la certeza es que te llevás poco",
        "Agarraste lo seguro. Como decía Maquiavelo, el fin justifica los medios",
        "Te vas con lo que hay. Estábamos remando en dulce de leche",
      ],
      neutral: [
        "Las victorias sirven para reafirmar las convicciones. Tu convicción era agarrar",
        "Cerraste el trato. Aristóteles decía que somos lo que hacemos repetidamente. Vos sos un tipo que agarra. No es poesía, pero es rentable",
        "No es lo que parece, es lo que uno interpreta. Y vos interpretaste bien",
        "Te vas con plata y con dignidad. En este juego, casi nadie se va con las dos",
        "Buen deal. El fútbol tiene alargue y penales. Los maletines no. Supiste leer el reglamento de la vida",
      ],
      desperate: [
        "¡Te llevás una fortuna! ¡Fue una mezcla de sangre y utopía!",
        "¡A la mesa entraron números y salieron leyendas! ¡Sos una leyenda!",
        "¡Cazador de utopías! ¡Y la utopía se hizo realidad!",
        "¡Me dejaste los cimientos nomás! ¡Viniste, tiraste la casa abajo y te llevaste hasta los escombros!",
        "¡Esto es un parto! ¡Pero nació algo hermoso para vos!",
        "¡Tenemos un corazón que no se rinde! ¡Y un presupuesto que sí!",
      ],
    },
  },
  // D10S — el banquero que respeta a los valientes y bardea a los que arreglan
  {
    image: "/images/comodin-QF.jpg",
    offerMultiplier: 0.87,
    offer: {
      smug: [
        "Tomá esto y comprate unas orejas de ratón, para lo que te queda en el tablero...",
        "Después de los maletines que abriste, esto es un regalo del cielo. Literal: mirá quién te lo está dando",
        "Te quedó el tablero como mi tobillo en el 90: hinchado y sin nada bueno adentro",
        "Esta oferta es más de lo que merecés, pibe. Reventaste todo lo grande vos solito",
        "Agarrá esto. Se te escapó la tortuga hace tres maletines y ni te diste cuenta",
      ],
      neutral: [
        "La oferta está bien. Ahora, los valientes no negocian. Decidí vos qué sos",
        "Yo nunca agarré lo seguro en mi vida. Por eso soy Dios y vos estás dudando",
        "Plata buena, eh. Si la agarrás no pasa nada... pecho frío",
        "Mirá que el tablero es traicionero como un lateral con mañas. La oferta, en cambio, es plata segura",
        "Esto es como un cambio de frente: podés jugarla segura o meter el pase del mundial. Vos sabrás",
        "Te ofrezco esto. La pelota no se mancha, pero la plata tampoco, pibe",
      ],
      desperate: [
        "¡Agarrá esta plata! ¡Es más de lo que me pagaron en Boca y en el Barsa juntos!",
        "¡Tomá la oferta, pibe! ¡Ni yo junté tanta suerte junta, y mirá que era Dios!",
        "¡Esta oferta es un golazo de mitad de cancha! ¡No la dejes pasar!",
        "¡Te estoy dando el mundial servido! ¡Agarralo antes de que me arrepienta y llame al VAR!",
        "¡AGARRÁ! ¡Ni a Shilton le dieron tantas oportunidades!",
      ],
    },
    noDeal: {
      smug: [
        "Seguí nomás, total lo bueno ya lo reventaste vos",
        "Vos seguí, que el tablero está más vacío que un clásico sin hinchada",
        "Rechazaste dos mangos. Bueno, coherente: no había nada que rechazar",
        "Dale, seguí. La tortuga ya se escapó igual",
      ],
      neutral: [
        "Así se juega: sin miedo. Me gusta, pibe",
        "Rechazaste. Bien. El miedo no sirve ni para cruzar la calle",
        "No deal. El potrero te hubiera aplaudido esa",
        "Seguís vivo y seguís jugando. Es lo único que pedí siempre",
        "Bien ahí. Los que arreglan temprano no entran en la historia",
      ],
      desperate: [
        "¡ESTE PIBE TIENE SANGRE DE POTRERO! ¡NO LE IMPORTA NADA!",
        "¡Rechazó TODO! ¡Barrilete cósmico, ¿de qué planeta viniste?!",
        "¡NO PUEDO CREER LO QUE VEO! ¡Ni yo era tan guapo, y jugué un mundial rengo!",
        "¡Le dije Dios a este juego y me está ganando el pibe!",
        "¡Seguís?! ¡SEGUÍS! ¡Esto es el gol del siglo de los deals!",
      ],
    },
    deal: {
      smug: [
        "Agarraste dos mangos. Algo es algo... pecho frío",
        "Deal con lo que quedaba. La tortuga ya estaba en Ezeiza igual",
        "Cerraste con lo mínimo. Bueno, del descenso también se vuelve",
        "Te llevás algo. Poco, pero algo. Como un empate de visitante",
      ],
      neutral: [
        "Cerraste bien, pibe. No es de valiente, pero es de vivo. Y los vivos también ganan",
        "Deal. La plata no se mancha... pará, eso no era así",
        "Trato hecho. No sos barrilete cósmico, pero tampoco sos pecho frío. Zona media",
        "Bien negociado. Yo hubiera seguido, pero yo también terminé como terminé",
      ],
      desperate: [
        "¡Te llevaste una fortuna! ¡Me desplumaste, y yo que venía de vuelta de todo!",
        "¡Qué jugador! ¡Me sacaste hasta la corona! Andá, disfrutala, te la ganaste",
        "¡Esto es un robo peor que el de los ingleses en el 66! ¡Pero te lo aplaudo!",
        "¡Deal histórico! ¡Contale a tus nietos que le ganaste a Dios en su propio castillo!",
      ],
    },
  },
];
