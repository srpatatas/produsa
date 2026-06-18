import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";
import { isMatchLocked } from "@/lib/lockCheck";
import { VALID_OUTCOMES } from "@/lib/outcomeStyles";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();
  const rows = await sql`
    SELECT match_id, outcome FROM planilla_predictions
    WHERE user_id = ${session.id}
  `;

  const predictions: Record<string, { matchId: string; outcome: string }> = {};
  for (const row of rows) {
    predictions[row.match_id as string] = {
      matchId: row.match_id as string,
      outcome: row.outcome as string,
    };
  }

  return NextResponse.json({ predictions });
});

export const POST = withAuth(async (req, session) => {
  const { matchId, outcome } = await req.json();

  if (!matchId || !outcome) {
    return NextResponse.json({ error: "matchId y outcome requeridos" }, { status: 400 });
  }

  if (!VALID_OUTCOMES.includes(outcome)) {
    return NextResponse.json({ error: "Outcome inválido" }, { status: 400 });
  }

  if (await isMatchLocked(matchId)) {
    return NextResponse.json({ error: "Predicciones cerradas para este partido" }, { status: 403 });
  }

  const sql = getDb();

  // Block doble on a match that has comodín
  if (outcome.length === 2) {
    const comodin = await sql`
      SELECT 1 FROM planilla_comodines
      WHERE user_id = ${session.id} AND match_id = ${matchId}
    `;
    if (comodin.length > 0) {
      return NextResponse.json({ error: "No se puede poner DOBLE en un partido con COMODÍN" }, { status: 400 });
    }
  }

  await sql`
    INSERT INTO planilla_predictions (user_id, match_id, outcome)
    VALUES (${session.id}, ${matchId}, ${outcome})
    ON CONFLICT (user_id, match_id)
    DO UPDATE SET outcome = ${outcome}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
});

export const DELETE = withAuth(async (req, session) => {
  const { matchId } = await req.json();
  if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 });

  if (await isMatchLocked(matchId)) {
    return NextResponse.json({ error: "Predicciones cerradas para este partido" }, { status: 403 });
  }

  const sql = getDb();
  await sql`
    DELETE FROM planilla_predictions
    WHERE user_id = ${session.id} AND match_id = ${matchId}
  `;

  return NextResponse.json({ ok: true });
});
