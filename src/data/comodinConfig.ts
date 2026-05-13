export interface ComodinConfig {
  scope: string;
  image: string;
  name: string;
}

export const comodinConfigs: Record<string, ComodinConfig> = {
  "fecha-1": { scope: "fecha-1", image: "/images/comodin-fecha-1.jpg", name: "Comodín Fecha 1" },
  "fecha-2": { scope: "fecha-2", image: "/images/comodin-fecha-2.jpg", name: "Comodín Fecha 2" },
  "fecha-3": { scope: "fecha-3", image: "/images/comodin-fecha-3.jpg", name: "Comodín Fecha 3" },
  "R32": { scope: "R32", image: "/images/comodin-R32.jpg", name: "Comodín Dieciseisavos" },
  "R16": { scope: "R16", image: "/images/comodin-R16.jpg", name: "Comodín Octavos" },
  "QF": { scope: "QF", image: "/images/comodin-QF.jpg", name: "Comodín Cuartos" },
  "SF": { scope: "SF", image: "/images/comodin-SF.jpg", name: "Comodín Semifinales" },
  "FINAL": { scope: "FINAL", image: "/images/comodin-FINAL.jpg", name: "Comodín Final" },
};

export function getComodinConfig(scope: string): ComodinConfig {
  return comodinConfigs[scope] ?? comodinConfigs["fecha-1"];
}
