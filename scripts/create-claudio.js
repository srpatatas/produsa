/**
 * Create AI player "Claudio" and submit all group stage predictions.
 *
 * Run with: node scripts/create-claudio.js
 *
 * Uses PROD_DATABASE_URL from .env.local
 */

const fs = require("fs");
const bcrypt = require("bcryptjs");

// Parse .env.local
const envFile = fs.readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=["']?(.+?)["']?$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const DB_URL = process.env.PROD_DATABASE_URL;
if (!DB_URL) {
  console.error("PROD_DATABASE_URL not set");
  process.exit(1);
}

// ─── PREDICTIONS ──────────────────────────────────────────────────────────────

const FECHA_1 = {
  predictions: [
    // Group A
    { matchId: "A-1", outcome: "L" },  // MEX vs RSA — Mexico at Azteca
    { matchId: "A-2", outcome: "L" },  // KOR vs CZE — Korea stronger
    // Group B
    { matchId: "B-1", outcome: "L" },  // CAN vs BIH — Canada at home
    { matchId: "B-2", outcome: "V" },  // QAT vs SUI — Switzerland clearly better
    // Group C
    { matchId: "C-1", outcome: "LE" }, // BRA vs MAR — close, hedge with double
    { matchId: "C-2", outcome: "V" },  // HAI vs SCO — Scotland should win
    // Group D
    { matchId: "D-1", outcome: "L" },  // USA vs PAR — USA at home in LA
    { matchId: "D-2", outcome: "L" },  // TUR vs AUS — Turkey stronger
    // Group E
    { matchId: "E-1", outcome: "L" },  // GER vs CUW — Germany dominant
    { matchId: "E-2", outcome: "E" },  // CIV vs ECU — toss-up, predict draw
    // Group F
    { matchId: "F-1", outcome: "L" },  // NED vs JPN — Netherlands edge
    { matchId: "F-2", outcome: "L" },  // SWE vs TUN — Sweden edge
    // Group G
    { matchId: "G-1", outcome: "L" },  // BEL vs EGY — Belgium still quality
    { matchId: "G-2", outcome: "L" },  // IRN vs NZL — Iran comfortable
    // Group H
    { matchId: "H-1", outcome: "L" },  // ESP vs CPV — Spain dominant
    { matchId: "H-2", outcome: "V" },  // KSA vs URU — Uruguay much stronger
    // Group I
    { matchId: "I-1", outcome: "L" },  // FRA vs SEN — France strong favorite
    { matchId: "I-2", outcome: "V" },  // IRQ vs NOR — Haaland factor
    // Group J
    { matchId: "J-1", outcome: "L" },  // ARG vs ALG — Argentina overwhelming
    { matchId: "J-2", outcome: "L" },  // AUT vs JOR — Austria should win
    // Group K
    { matchId: "K-1", outcome: "L" },  // POR vs COD — Portugal big favorite
    { matchId: "K-2", outcome: "V" },  // UZB vs COL — Colombia much stronger
    // Group L
    { matchId: "L-1", outcome: "L" },  // ENG vs CRO — England slight edge
    { matchId: "L-2", outcome: "L" },  // GHA vs PAN — Ghana should win
  ],
  comodin: { scope: "fecha-1", matchId: "A-1" },   // MEX vs RSA — very confident
  double: { fecha: 1, matchId: "C-1" },             // BRA vs MAR — hedging LE
  exactScore: { matchId: "F-1", homeScore: 2, awayScore: 1 }, // NED 2-1 JPN
};

const FECHA_2 = {
  predictions: [
    // Group A
    { matchId: "A-3", outcome: "L" },  // CZE vs RSA — Czechia edge
    { matchId: "A-4", outcome: "L" },  // MEX vs KOR — Mexico at home again
    // Group B
    { matchId: "B-3", outcome: "L" },  // SUI vs BIH — Switzerland comfortable
    { matchId: "B-4", outcome: "L" },  // CAN vs QAT — Canada at home
    // Group C
    { matchId: "C-3", outcome: "V" },  // SCO vs MAR — Morocco stronger
    { matchId: "C-4", outcome: "L" },  // BRA vs HAI — Brazil dominant
    // Group D
    { matchId: "D-3", outcome: "L" },  // USA vs AUS — USA at home
    { matchId: "D-4", outcome: "L" },  // TUR vs PAR — Turkey quality
    // Group E
    { matchId: "E-3", outcome: "L" },  // GER vs CIV — Germany should win
    { matchId: "E-4", outcome: "L" },  // ECU vs CUW — Ecuador dominant
    // Group F
    { matchId: "F-3", outcome: "L" },  // NED vs SWE — Netherlands stronger
    { matchId: "F-4", outcome: "V" },  // TUN vs JPN — Japan better
    // Group G
    { matchId: "G-3", outcome: "L" },  // BEL vs IRN — Belgium should win
    { matchId: "G-4", outcome: "V" },  // NZL vs EGY — Egypt with Salah
    // Group H
    { matchId: "H-3", outcome: "L" },  // ESP vs KSA — Spain dominant
    { matchId: "H-4", outcome: "L" },  // URU vs CPV — Uruguay dominant
    // Group I
    { matchId: "I-3", outcome: "L" },  // FRA vs IRQ — France dominant
    { matchId: "I-4", outcome: "LE" }, // NOR vs SEN — close, hedge with double
    // Group J
    { matchId: "J-3", outcome: "L" },  // ARG vs AUT — Argentina strong
    { matchId: "J-4", outcome: "V" },  // JOR vs ALG — Algeria edge
    // Group K
    { matchId: "K-3", outcome: "L" },  // POR vs UZB — Portugal dominant
    { matchId: "K-4", outcome: "L" },  // COL vs COD — Colombia should win
    // Group L
    { matchId: "L-3", outcome: "L" },  // ENG vs GHA — England should win
    { matchId: "L-4", outcome: "V" },  // PAN vs CRO — Croatia stronger
  ],
  comodin: { scope: "fecha-2", matchId: "B-3" },    // SUI vs BIH — very confident
  double: { fecha: 2, matchId: "I-4" },             // NOR vs SEN — hedging LE
  exactScore: { matchId: "L-3", homeScore: 2, awayScore: 0 }, // ENG 2-0 GHA
};

const FECHA_3 = {
  predictions: [
    // Group A
    { matchId: "A-5", outcome: "L" },  // MEX vs CZE — Mexico at Azteca
    { matchId: "A-6", outcome: "V" },  // RSA vs KOR — Korea slightly better
    // Group B
    { matchId: "B-5", outcome: "L" },  // SUI vs CAN — Switzerland edge
    { matchId: "B-6", outcome: "L" },  // BIH vs QAT — Bosnia should win
    // Group C
    { matchId: "C-5", outcome: "V" },  // SCO vs BRA — Brazil wins
    { matchId: "C-6", outcome: "L" },  // MAR vs HAI — Morocco dominant
    // Group D
    { matchId: "D-5", outcome: "EV" }, // TUR vs USA — close, hedge with double
    { matchId: "D-6", outcome: "E" },  // PAR vs AUS — toss-up draw
    // Group E
    { matchId: "E-5", outcome: "V" },  // CUW vs CIV — Ivory Coast wins
    { matchId: "E-6", outcome: "V" },  // ECU vs GER — Germany wins away
    // Group F
    { matchId: "F-5", outcome: "L" },  // JPN vs SWE — Japan wins
    { matchId: "F-6", outcome: "V" },  // TUN vs NED — Netherlands wins
    // Group G
    { matchId: "G-5", outcome: "L" },  // EGY vs IRN — Egypt with Salah
    { matchId: "G-6", outcome: "V" },  // NZL vs BEL — Belgium wins
    // Group H
    { matchId: "H-5", outcome: "V" },  // CPV vs KSA — Saudi edge
    { matchId: "H-6", outcome: "V" },  // URU vs ESP — Spain slight edge
    // Group I
    { matchId: "I-5", outcome: "V" },  // NOR vs FRA — France wins
    { matchId: "I-6", outcome: "L" },  // SEN vs IRQ — Senegal wins
    // Group J
    { matchId: "J-5", outcome: "V" },  // ALG vs AUT — Austria edge
    { matchId: "J-6", outcome: "V" },  // JOR vs ARG — Argentina dominant
    // Group K
    { matchId: "K-5", outcome: "E" },  // COL vs POR — great match, draw
    { matchId: "K-6", outcome: "L" },  // COD vs UZB — DR Congo wins
    // Group L
    { matchId: "L-5", outcome: "V" },  // PAN vs ENG — England wins
    { matchId: "L-6", outcome: "L" },  // CRO vs GHA — Croatia wins
  ],
  comodin: { scope: "fecha-3", matchId: "G-5" },    // EGY vs IRN — Egypt confident
  double: { fecha: 3, matchId: "D-5" },             // TUR vs USA — hedging EV
  exactScore: { matchId: "K-6", homeScore: 2, awayScore: 0 }, // COD 2-0 UZB
};

const BONUS = [
  { questionId: "campeon", answer: "ARG" },
  { questionId: "subcampeon", answer: "FRA" },
  { questionId: "tercer-puesto", answer: "ESP" },
  { questionId: "goleador", answer: "Mbappé" },
  { questionId: "ultimo-mundial", answer: "CUW" },
  { questionId: "ultimo-prode", answer: "Hector Larrea" },
  { questionId: "primer-prode", answer: "El Poeta" },
  { questionId: "valla-menos", answer: "ESP" },
  { questionId: "valla-mas", answer: "CUW" },
  { questionId: "revelacion", answer: "JPN" },
  { questionId: "balon-oro", answer: "Mbappé" },
  { questionId: "balon-plata", answer: "Messi" },
  { questionId: "balon-bronce", answer: "Vinícius Jr." },
  { questionId: "fair-play", answer: "JPN" },
  { questionId: "anti-fair-play", answer: "MAR" },
  { questionId: "primer-gol-arg", answer: "Lautaro Martínez" },
  { questionId: "ultimo-gol-arg", answer: "Julián Álvarez" },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const { neon } = require("@neondatabase/serverless");
  const sql = neon(DB_URL);

  // 1. Create user Claudio
  console.log("Creating user Claudio...");
  const hashedPin = await bcrypt.hash("2026", 10);

  const existing = await sql`SELECT id FROM users WHERE invite_code = 'CLAUDIO2026'`;
  let userId;

  if (existing.length > 0) {
    userId = existing[0].id;
    console.log(`  User already exists (id: ${userId})`);
  } else {
    const rows = await sql`
      INSERT INTO users (name, invite_code, pin, avatar, is_admin)
      VALUES ('Claudio', 'CLAUDIO2026', ${hashedPin}, '🤖', false)
      RETURNING id
    `;
    userId = rows[0].id;
    console.log(`  ✓ Created user Claudio (id: ${userId})`);
  }

  // 2. Insert all match predictions
  const allFechas = [FECHA_1, FECHA_2, FECHA_3];
  let predCount = 0;

  for (const fecha of allFechas) {
    for (const pred of fecha.predictions) {
      await sql`
        INSERT INTO planilla_predictions (user_id, match_id, outcome)
        VALUES (${userId}, ${pred.matchId}, ${pred.outcome})
        ON CONFLICT (user_id, match_id)
        DO UPDATE SET outcome = ${pred.outcome}, updated_at = NOW()
      `;
      predCount++;
    }
  }
  console.log(`  ✓ ${predCount} match predictions inserted`);

  // 3. Insert comodines
  for (const fecha of allFechas) {
    await sql`
      INSERT INTO planilla_comodines (user_id, scope, match_id)
      VALUES (${userId}, ${fecha.comodin.scope}, ${fecha.comodin.matchId})
      ON CONFLICT (user_id, scope)
      DO UPDATE SET match_id = ${fecha.comodin.matchId}, created_at = NOW()
    `;
  }
  console.log("  ✓ 3 comodines inserted (fecha-1: A-1, fecha-2: B-3, fecha-3: G-5)");

  // 4. Insert doubles
  for (const fecha of allFechas) {
    await sql`
      INSERT INTO planilla_doubles (user_id, fecha, match_id)
      VALUES (${userId}, ${fecha.double.fecha}, ${fecha.double.matchId})
      ON CONFLICT (user_id, fecha)
      DO UPDATE SET match_id = ${fecha.double.matchId}, created_at = NOW()
    `;
  }
  console.log("  ✓ 3 doubles inserted (F1: C-1, F2: I-4, F3: D-5)");

  // 5. Insert exact scores
  for (const fecha of allFechas) {
    const es = fecha.exactScore;
    await sql`
      INSERT INTO exact_score_predictions (user_id, match_id, home_score, away_score)
      VALUES (${userId}, ${es.matchId}, ${es.homeScore}, ${es.awayScore})
      ON CONFLICT (user_id, match_id)
      DO UPDATE SET home_score = ${es.homeScore}, away_score = ${es.awayScore}, updated_at = NOW()
    `;
  }
  console.log("  ✓ 3 exact scores inserted (F-1: 2-1, L-3: 2-0, K-6: 2-0)");

  // 6. Insert bonus predictions
  for (const bonus of BONUS) {
    await sql`
      INSERT INTO bonus_predictions (user_id, question_id, answer)
      VALUES (${userId}, ${bonus.questionId}, ${bonus.answer})
      ON CONFLICT (user_id, question_id)
      DO UPDATE SET answer = ${bonus.answer}, updated_at = NOW()
    `;
  }
  console.log(`  ✓ ${BONUS.length} bonus predictions inserted`);

  console.log("\n✅ Claudio is ready to compete!");
  console.log("\nSummary:");
  console.log("  Name: Claudio");
  console.log("  Avatar: 🤖");
  console.log("  72 group stage match predictions");
  console.log("  3 comodines, 3 doubles, 3 exact scores");
  console.log("  17 bonus questions answered");
  console.log("\n  Campeón: Argentina");
  console.log("  Subcampeón: Francia");
  console.log("  3er puesto: España");
  console.log("  Goleador: Mbappé");
  console.log("  Revelación: Japón");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
