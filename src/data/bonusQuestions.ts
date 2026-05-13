import { BonusQuestion } from "@/types";

export const bonusQuestions: BonusQuestion[] = [
  { id: "campeon", label: "Campeón", sourceType: "teams", lockScope: "fecha-1" },
  { id: "subcampeon", label: "Subcampeón", sourceType: "teams", lockScope: "fecha-1" },
  { id: "tercer-puesto", label: "3er Puesto", sourceType: "teams", lockScope: "fecha-1" },
  { id: "goleador", label: "Goleador", sourceType: "players", lockScope: "fecha-1" },
  { id: "ultimo-mundial", label: "Último puesto Mundial", sourceType: "teams", lockScope: "fecha-1" },
  { id: "ultimo-prode", label: "Último puesto Prode", sourceType: "participants", lockScope: "fecha-1" },
  { id: "primer-prode", label: "Primer puesto Prode", sourceType: "participants", lockScope: "fecha-1" },
  { id: "valla-menos", label: "Valla menos vencida", sourceType: "teams", lockScope: "fecha-1" },
  { id: "valla-mas", label: "Valla más vencida", sourceType: "teams", lockScope: "fecha-1" },
  { id: "revelacion", label: "Equipo revelación", sourceType: "teams", lockScope: "fecha-1" },
  { id: "balon-oro", label: "Balón de oro FIFA", sourceType: "players", lockScope: "fecha-1" },
  { id: "balon-plata", label: "Balón de plata FIFA", sourceType: "players", lockScope: "fecha-1" },
  { id: "balon-bronce", label: "Balón de bronce FIFA", sourceType: "players", lockScope: "fecha-1" },
  { id: "fair-play", label: "País Fair Play", sourceType: "teams", lockScope: "fecha-1" },
  { id: "anti-fair-play", label: "País Anti-Fair Play", sourceType: "teams", lockScope: "fecha-1" },
  { id: "primer-gol-arg", label: "Primer gol argentino", sourceType: "players", lockScope: "fecha-1" },
  { id: "ultimo-gol-arg", label: "Último gol argentino", sourceType: "players", lockScope: "fecha-1" },
];

export function getBonusQuestion(id: string): BonusQuestion | undefined {
  return bonusQuestions.find((q) => q.id === id);
}
