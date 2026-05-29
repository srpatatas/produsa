export interface ComodinConfig {
  scope: string;
  image: string;
  name: string;
  phrases: string[];
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
      "Yo ya sé quién gana. ¿Vos?",
      "¡METEME EN UN PARTIDO QUE ESTOY ON FIRE!",
      "¿Sabías que con las orejas de Minnie tengo más poder?",
      "¡2 PUNTITOS EXTRA, SEÑORES! ¡QUÉ EMOCIÓN!",
    ],
  },
  "fecha-3": {
    scope: "fecha-3",
    image: "/images/comodin-fecha-3.jpg",
    name: "Donald Trump",
    phrases: [
      "This is going to be the GREATEST prediction ever made.",
      "Poneme en un partido. I guarantee you, it'll be HUGE.",
      "Nobody knows football better than me. NOBODY.",
      "I'm giving you 2 points. You're welcome, tremendous deal.",
      "Fake predictions are OVER. Use me.",
      "We're going to win so much, you'll get tired of winning.",
      "I built a wall of points. And the other team paid for it.",
      "Many people are saying I'm the best comodín. Many people.",
      "Make your prode great again. Arrastrame.",
      "The hat? It's a Donald Duck hat. Very classy, very cool.",
    ],
  },
  "R32": { scope: "R32", image: "/images/comodin-R32.jpg", name: "Comodín Dieciseisavos", phrases: [] },
  "R16": { scope: "R16", image: "/images/comodin-R16.jpg", name: "Comodín Octavos", phrases: [] },
  "QF": { scope: "QF", image: "/images/comodin-QF.jpg", name: "Comodín Cuartos", phrases: [] },
  "SF": { scope: "SF", image: "/images/comodin-SF.jpg", name: "Comodín Semifinales", phrases: [] },
  "FINAL": { scope: "FINAL", image: "/images/comodin-FINAL.jpg", name: "Comodín Final", phrases: [] },
};

export function getComodinConfig(scope: string): ComodinConfig {
  return comodinConfigs[scope] ?? comodinConfigs["fecha-1"];
}
