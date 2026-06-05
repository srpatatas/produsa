/**
 * Parse FIFA official squad list PDF (extracted via pdftotext -layout) into squads.json.
 *
 * Usage:
 *   1. pdftotext -layout SquadLists-Spanish.pdf squads-layout.txt
 *   2. node --experimental-strip-types scripts/parse-fifa-squads.ts squads-layout.txt
 *
 * Output: scripts/data/squads.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";

const POS_MAP: Record<string, string> = {
  "PO": "GK",
  "DF": "DF",
  "MC": "MF",
  "DC": "FW",
};

interface SquadPlayer {
  teamCode: string;
  teamName: string;
  name: string;
  position: string;
  number: number;
}

const inputFile = process.argv[2];
if (!inputFile) {
  console.error("Usage: node --experimental-strip-types scripts/parse-fifa-squads.ts <squads-layout.txt>");
  process.exit(1);
}

const text = readFileSync(inputFile, "utf-8");
const lines = text.split("\n");

const allPlayers: SquadPlayer[] = [];
let currentTeam: { name: string; code: string } | null = null;

const teamHeaderRegex = /^\s+(\S[^\(\)]+?)\s+\(([A-Z]{3})\)\s*$/;
const playerRowRegex = /^\s*(\d{1,2})\s+(PO|DF|MC|DC)\s{2,}(\S.+?)\s{10,}/;

for (const line of lines) {
  const teamMatch = line.match(teamHeaderRegex);
  if (teamMatch) {
    const name = teamMatch[1].trim();
    const code = teamMatch[2];
    // Skip club names — they appear in the CLUB column and contain patterns like "FC", "CF", etc.
    // Team headers are indented far right and appear after page headers
    if (
      /\b(FC|CF|SC|AC|AS|SL|SE|CA|RC|BSC|VfL|FK|SK|LAFC)\b/.test(name) ||
      /\b(Club|United|City|Rovers|Wanderers|Athletic|Sporting|Rangers|Celtic|Hearts|Crew|Revolution|Rapids|Fire|Galaxy|Sounders)\b/.test(name)
    ) {
      continue;
    }
    currentTeam = { name, code };
    continue;
  }

  if (!currentTeam) continue;

  const playerMatch = line.match(playerRowRegex);
  if (playerMatch) {
    const number = parseInt(playerMatch[1], 10);
    const position = POS_MAP[playerMatch[2]];
    const rawName = playerMatch[3].trim();

    // "NOMBRE DEL JUGADOR" column: "LASTNAME Firstname" format
    // Extract up to where the next column starts (large whitespace gap)
    // Clean up: take the display name as-is
    const name = rawName
      .replace(/\s{2,}.*$/, "") // cut at first big whitespace gap (next column)
      .trim();

    if (!name || name === "NOMBRE DEL JUGADOR") continue;

    allPlayers.push({
      teamCode: currentTeam.code,
      teamName: currentTeam.name,
      name: formatName(name),
      position,
      number,
    });
  }
}

function formatName(raw: string): string {
  // Input: "LASTNAME Firstname" or "LASTNAME Firstname Middlename"
  // Output: "Firstname Lastname" (title-cased)
  const parts = raw.split(/\s+/);

  // Find where uppercase surname ends and mixed-case first name begins
  let firstNameStart = 0;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] !== parts[i].toUpperCase() || /[a-z]/.test(parts[i])) {
      firstNameStart = i;
      break;
    }
    firstNameStart = parts.length; // all uppercase = just surname
  }

  if (firstNameStart === 0 || firstNameStart >= parts.length) {
    // Can't split — return title-cased whole string
    return raw.split(/\s+/).map(titleCase).join(" ");
  }

  const surname = parts.slice(0, firstNameStart).map(titleCase).join(" ");
  const firstName = parts.slice(firstNameStart).join(" ");

  return `${firstName} ${surname}`;
}

function titleCase(word: string): string {
  if (word.length === 0) return word;
  // Handle hyphenated names
  if (word.includes("-")) {
    return word.split("-").map(titleCase).join("-");
  }
  // Handle apostrophes (D'Ivoire, etc.)
  if (word.includes("'") || word.includes("'")) {
    const sep = word.includes("'") ? "'" : "'";
    return word.split(sep).map(titleCase).join(sep);
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Summary
const teamCounts = new Map<string, number>();
for (const p of allPlayers) {
  teamCounts.set(p.teamCode, (teamCounts.get(p.teamCode) || 0) + 1);
}

console.log(`Parsed ${allPlayers.length} players across ${teamCounts.size} teams:\n`);
for (const [code, count] of [...teamCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const status = count >= 23 ? "✓" : "⚠";
  console.log(`  ${status} ${code}: ${count} players`);
}

const missing48 = 48 - teamCounts.size;
if (missing48 > 0) {
  console.log(`\n⚠ Missing ${missing48} teams!`);
}

mkdirSync("scripts/data", { recursive: true });
writeFileSync("scripts/data/squads.json", JSON.stringify(allPlayers, null, 2));
console.log(`\n✓ Saved to scripts/data/squads.json`);
