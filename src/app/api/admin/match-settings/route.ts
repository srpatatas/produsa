import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAdmin } from "@/lib/apiAuth";
import { matches } from "@/data/matches";
import { knockoutMatches } from "@/data/knockoutMatches";

export const GET = withAdmin(async (req, session) => {
  const sql = getDb();
  const rows = await sql`SELECT match_id, comodin_allowed, exact_score FROM match_settings`;

  const settings: Record<string, { comodinAllowed: boolean; exactScore: boolean }> = {};
  for (const row of rows) {
    settings[row.match_id as string] = {
      comodinAllowed: row.comodin_allowed as boolean,
      exactScore: row.exact_score as boolean,
    };
  }
  return NextResponse.json({ settings });
});

export const POST = withAdmin(async (req, session) => {
  const body = await req.json();
  const { matchId, comodinAllowed, exactScore } = body as {
    matchId: string;
    comodinAllowed: boolean;
    exactScore: boolean;
  };

  if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 });
  if (comodinAllowed && exactScore) return NextResponse.json({ error: "Un partido no puede tener comodín y exacto" }, { status: 400 });

  const sql = getDb();

  // If setting exact_score to true, clear any other exact_score in the same scope
  if (exactScore) {
    const groupMatch = matches.find((m) => m.id === matchId);
    if (groupMatch) {
      const sameMatchday = matches.filter((m) => m.matchday === groupMatch.matchday).map((m) => m.id);
      const others = sameMatchday.filter((id) => id !== matchId);
      if (others.length > 0) {
        await sql`UPDATE match_settings SET exact_score = false WHERE match_id = ANY(${others})`;
      }
    }
    const koMatch = knockoutMatches.find((m) => m.id === matchId);
    if (koMatch) {
      const round = koMatch.round === "3P" || koMatch.round === "F" ? ["3P", "F"] : [koMatch.round];
      const sameRound = knockoutMatches.filter((m) => round.includes(m.round)).map((m) => m.id);
      const others = sameRound.filter((id) => id !== matchId);
      if (others.length > 0) {
        await sql`UPDATE match_settings SET exact_score = false WHERE match_id = ANY(${others})`;
      }
    }
  }

  await sql`
    INSERT INTO match_settings (match_id, comodin_allowed, exact_score)
    VALUES (${matchId}, ${comodinAllowed}, ${exactScore})
    ON CONFLICT (match_id) DO UPDATE SET comodin_allowed = ${comodinAllowed}, exact_score = ${exactScore}
  `;

  return NextResponse.json({ ok: true });
});
