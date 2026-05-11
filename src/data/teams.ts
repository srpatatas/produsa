import { Team } from "@/types";

export const teams: Record<string, Team> = {
  MEX: { id: "MEX", name: "México", shortName: "MEX", flagCode: "mx", confederation: "CONCACAF" },
  RSA: { id: "RSA", name: "Sudáfrica", shortName: "RSA", flagCode: "za", confederation: "CAF" },
  KOR: { id: "KOR", name: "Corea del Sur", shortName: "KOR", flagCode: "kr", confederation: "AFC" },
  CZE: { id: "CZE", name: "Rep. Checa", shortName: "CZE", flagCode: "cz", confederation: "UEFA" },

  CAN: { id: "CAN", name: "Canadá", shortName: "CAN", flagCode: "ca", confederation: "CONCACAF" },
  BIH: { id: "BIH", name: "Bosnia y Herzegovina", shortName: "BIH", flagCode: "ba", confederation: "UEFA" },
  QAT: { id: "QAT", name: "Catar", shortName: "QAT", flagCode: "qa", confederation: "AFC" },
  SUI: { id: "SUI", name: "Suiza", shortName: "SUI", flagCode: "ch", confederation: "UEFA" },

  BRA: { id: "BRA", name: "Brasil", shortName: "BRA", flagCode: "br", confederation: "CONMEBOL" },
  MAR: { id: "MAR", name: "Marruecos", shortName: "MAR", flagCode: "ma", confederation: "CAF" },
  HAI: { id: "HAI", name: "Haití", shortName: "HAI", flagCode: "ht", confederation: "CONCACAF" },
  SCO: { id: "SCO", name: "Escocia", shortName: "SCO", flagCode: "gb-sct", confederation: "UEFA" },

  USA: { id: "USA", name: "Estados Unidos", shortName: "USA", flagCode: "us", confederation: "CONCACAF" },
  PAR: { id: "PAR", name: "Paraguay", shortName: "PAR", flagCode: "py", confederation: "CONMEBOL" },
  AUS: { id: "AUS", name: "Australia", shortName: "AUS", flagCode: "au", confederation: "AFC" },
  TUR: { id: "TUR", name: "Turquía", shortName: "TUR", flagCode: "tr", confederation: "UEFA" },

  GER: { id: "GER", name: "Alemania", shortName: "GER", flagCode: "de", confederation: "UEFA" },
  CUW: { id: "CUW", name: "Curazao", shortName: "CUW", flagCode: "cw", confederation: "CONCACAF" },
  CIV: { id: "CIV", name: "Costa de Marfil", shortName: "CIV", flagCode: "ci", confederation: "CAF" },
  ECU: { id: "ECU", name: "Ecuador", shortName: "ECU", flagCode: "ec", confederation: "CONMEBOL" },

  NED: { id: "NED", name: "Países Bajos", shortName: "NED", flagCode: "nl", confederation: "UEFA" },
  JPN: { id: "JPN", name: "Japón", shortName: "JPN", flagCode: "jp", confederation: "AFC" },
  SWE: { id: "SWE", name: "Suecia", shortName: "SWE", flagCode: "se", confederation: "UEFA" },
  TUN: { id: "TUN", name: "Túnez", shortName: "TUN", flagCode: "tn", confederation: "CAF" },

  BEL: { id: "BEL", name: "Bélgica", shortName: "BEL", flagCode: "be", confederation: "UEFA" },
  EGY: { id: "EGY", name: "Egipto", shortName: "EGY", flagCode: "eg", confederation: "CAF" },
  IRN: { id: "IRN", name: "Irán", shortName: "IRN", flagCode: "ir", confederation: "AFC" },
  NZL: { id: "NZL", name: "Nueva Zelanda", shortName: "NZL", flagCode: "nz", confederation: "OFC" },

  ESP: { id: "ESP", name: "España", shortName: "ESP", flagCode: "es", confederation: "UEFA" },
  CPV: { id: "CPV", name: "Cabo Verde", shortName: "CPV", flagCode: "cv", confederation: "CAF" },
  KSA: { id: "KSA", name: "Arabia Saudita", shortName: "KSA", flagCode: "sa", confederation: "AFC" },
  URU: { id: "URU", name: "Uruguay", shortName: "URU", flagCode: "uy", confederation: "CONMEBOL" },

  FRA: { id: "FRA", name: "Francia", shortName: "FRA", flagCode: "fr", confederation: "UEFA" },
  SEN: { id: "SEN", name: "Senegal", shortName: "SEN", flagCode: "sn", confederation: "CAF" },
  IRQ: { id: "IRQ", name: "Irak", shortName: "IRQ", flagCode: "iq", confederation: "AFC" },
  NOR: { id: "NOR", name: "Noruega", shortName: "NOR", flagCode: "no", confederation: "UEFA" },

  ARG: { id: "ARG", name: "Argentina", shortName: "ARG", flagCode: "ar", confederation: "CONMEBOL" },
  ALG: { id: "ALG", name: "Argelia", shortName: "ALG", flagCode: "dz", confederation: "CAF" },
  AUT: { id: "AUT", name: "Austria", shortName: "AUT", flagCode: "at", confederation: "UEFA" },
  JOR: { id: "JOR", name: "Jordania", shortName: "JOR", flagCode: "jo", confederation: "AFC" },

  POR: { id: "POR", name: "Portugal", shortName: "POR", flagCode: "pt", confederation: "UEFA" },
  COD: { id: "COD", name: "RD del Congo", shortName: "COD", flagCode: "cd", confederation: "CAF" },
  UZB: { id: "UZB", name: "Uzbekistán", shortName: "UZB", flagCode: "uz", confederation: "AFC" },
  COL: { id: "COL", name: "Colombia", shortName: "COL", flagCode: "co", confederation: "CONMEBOL" },

  ENG: { id: "ENG", name: "Inglaterra", shortName: "ENG", flagCode: "gb-eng", confederation: "UEFA" },
  CRO: { id: "CRO", name: "Croacia", shortName: "CRO", flagCode: "hr", confederation: "UEFA" },
  GHA: { id: "GHA", name: "Ghana", shortName: "GHA", flagCode: "gh", confederation: "CAF" },
  PAN: { id: "PAN", name: "Panamá", shortName: "PAN", flagCode: "pa", confederation: "CONCACAF" },
};

export function getTeam(id: string): Team {
  const team = teams[id];
  if (!team) throw new Error(`Unknown team: ${id}`);
  return team;
}
