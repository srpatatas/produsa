import { BonusQuestion } from "@/types";

export const bonusQuestions: BonusQuestion[] = [
  { id: "campeon", label: "Campeón", sourceType: "teams" },
  { id: "subcampeon", label: "Subcampeón", sourceType: "teams" },
  { id: "tercer-puesto", label: "3er Puesto", sourceType: "teams" },
  { id: "goleador", label: "Goleador", sourceType: "players" },
  { id: "ultimo-mundial", label: "Último puesto Mundial", sourceType: "teams" },
  { id: "ultimo-prode", label: "Último puesto Prode", sourceType: "participants" },
  { id: "primer-prode", label: "Primer puesto Prode", sourceType: "participants" },
  { id: "valla-menos", label: "Valla menos vencida", sourceType: "teams" },
  { id: "valla-mas", label: "Valla más vencida", sourceType: "teams" },
  { id: "revelacion", label: "Equipo revelación", sourceType: "teams" },
  { id: "balon-oro", label: "Balón de oro FIFA", sourceType: "players" },
  { id: "balon-plata", label: "Balón de plata FIFA", sourceType: "players" },
  { id: "balon-bronce", label: "Balón de bronce FIFA", sourceType: "players" },
  { id: "fair-play", label: "País Fair Play", sourceType: "teams" },
  { id: "anti-fair-play", label: "País Anti-Fair Play", sourceType: "teams" },
  { id: "primer-gol-arg", label: "Primer gol argentino", sourceType: "players" },
  { id: "ultimo-gol-arg", label: "Último gol argentino", sourceType: "players" },
];
