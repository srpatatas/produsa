export interface ComodinConfig {
  scope: string;
  image: string;
  name: string;
  phrases: string[];
  placementPhrase: string;
  rejectPhrases: string[];
}

export const comodinConfigs: Record<string, ComodinConfig> = {
  "fecha-1": {
    scope: "fecha-1",
    image: "/images/comodin-fecha-1.jpg",
    name: "Chiqui Tapia",
    phrases: [
      "Pssst... ¿querés 2 puntitos extra?",
      "Eh, vos... sí, vos. Tengo algo para vos.",
      "¿Estás seguro de ese resultado? Yo te puedo ayudar...",
      "Dale, arrastrame a un partido.",
      "No seas amarrete, usame.",
      "¿Qué mirás? Agarrame y poneme en un partido.",
      "2 puntos gratis. De nada.",
      "Soy tu amigo, confía en mí.",
      "Yo manejo la AFA, ¿no voy a poder manejar tu prode?",
      "Poneme en un partido y te hago la segunda.",
      "La pelota no se mancha... pero tu planilla sí si no me usás.",
      "Esto es como la Libertadores, hay que tener huevos. Poneme.",
      "Yo arreglé fixtures más difíciles que este. Dale, usame.",
      "¿Vas a dejar 2 puntos en la mesa? No seas Higuaín.",
      "Conmigo no hay VAR que te salve. Arrastrame.",
      "Los puntos son como los dólares, siempre querés más.",
    ],
    placementPhrase: "Dale, elegí un partido. Yo me encargo.",
    rejectPhrases: [
      "¡Ahí no, eso ya lo arreglé yo!",
      "Ese partido es muy fácil, elegí otro.",
      "No seas vivo, buscá uno más difícil.",
      "¡Ahí no vale! Probá con otro.",
    ],
  },
  "fecha-2": {
    scope: "fecha-2",
    image: "/images/comodin-fecha-2.jpg",
    name: "Pollo Vignolo",
    phrases: [
      "¡¡¡SEÑORES, ESTO ES FÚTBOL!!!",
      "¡PONEME EN UN PARTIDO, NO SEAS COBARDE!",
      "¡Qué lindo es el fútbol cuando me usás!",
      "¡GOOOL DE LA PREDICCIÓN! Ah no, todavía no me pusiste.",
      "Dale, arrastrame. ¡No te quedes ahí mirando!",
      "¡ES IMPRESIONANTE LO QUE PUEDE PASAR SI ME USÁS!",
      "¡METEME EN UN PARTIDO QUE ESTOY ON FIRE!",
      "¿Sabías que con las orejas de Minnie tengo más poder?",
      "¡2 PUNTITOS EXTRA, SEÑORES! ¡QUÉ EMOCIÓN!",
      "Viví, sentí, disfrutá y sumá 2 puntitos conmigo.",
      "¡Usalo, usalo, usalo, usalo!",
    ],
    placementPhrase: "¡¡¡ELEGÍ UN PARTIDO, SEÑORES!!!",
    rejectPhrases: [
      "¡¡¡ESE NO, ESE NO!!!",
      "¡Ese partido es más fácil que un penal sin arquero!",
      "¡NO ME PONGAS AHÍ QUE ME ABURRO!",
      "¡Buscá uno más picante, dale!",
      "No lo cante, no lo grite, no se abrace. ¡Ahí no se puede!",
    ],
  },
  "fecha-3": {
    scope: "fecha-3",
    image: "/images/comodin-fecha-3.jpg",
    name: "Donald Trump",
    phrases: [
      "This is going to be the GREATEST prediction ever made.",
      "Put me on a match. I guarantee you, it'll be HUGE.",
      "Nobody knows football better than me. NOBODY.",
      "I'm giving you 2 points. You're welcome, tremendous deal.",
      "Fake predictions are OVER. Use me.",
      "We're going to win so much, you'll get tired of winning.",
      "I built a wall of points. And the other team paid for it.",
      "Many people are saying I'm the best comodín. Many people.",
      "Make your prode great again. Drag me.",
      "The hat? It's a Donald Duck hat. Very classy, very cool.",
      "Put me there and make that match great again.",
    ],
    placementPhrase: "Pick a match. Make it great again.",
    rejectPhrases: [
      "That match is a DISASTER. Pick another one.",
      "WRONG match. Try again.",
      "That's a loser match. I only do winners.",
      "Not that one. SAD!",
    ],
  },
  "R32": { scope: "R32", image: "/images/comodin-R32.jpg", name: "Comodín Dieciseisavos", phrases: [], placementPhrase: "Dale, elegí un partido...", rejectPhrases: [] },
  "R16": { scope: "R16", image: "/images/comodin-R16.jpg", name: "Comodín Octavos", phrases: [], placementPhrase: "Dale, elegí un partido...", rejectPhrases: [] },
  "QF": { scope: "QF", image: "/images/comodin-QF.jpg", name: "Comodín Cuartos", phrases: [], placementPhrase: "Dale, elegí un partido...", rejectPhrases: [] },
  "SF": { scope: "SF", image: "/images/comodin-SF.jpg", name: "Comodín Semifinales", phrases: [], placementPhrase: "Dale, elegí un partido...", rejectPhrases: [] },
  "FINAL": { scope: "FINAL", image: "/images/comodin-FINAL.jpg", name: "Comodín Final", phrases: [], placementPhrase: "Dale, elegí un partido...", rejectPhrases: [] },
};

export function getComodinConfig(scope: string): ComodinConfig {
  return comodinConfigs[scope] ?? comodinConfigs["fecha-1"];
}
