import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";
import { isScopeLocked } from "@/lib/lockCheck";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();
  const rows = await sql`
    SELECT scope, match_id FROM planilla_comodines
    WHERE user_id = ${session.id}
  `;

  const comodines: Record<string, string> = {};
  for (const row of rows) {
    comodines[row.scope as string] = row.match_id as string;
  }

  return NextResponse.json({ comodines });
});

export const POST = withAuth(async (req, session) => {
  const { scope, matchId } = await req.json();

  if (!scope || !matchId) {
    return NextResponse.json({ error: "scope y matchId requeridos" }, { status: 400 });
  }

  if (await isScopeLocked(scope)) {
    return NextResponse.json({ error: "Comodines cerrados para esta fase" }, { status: 403 });
  }

  const sql = getDb();

  // Check if match allows comodín (if any settings exist)
  const allSettings = await sql`SELECT match_id FROM match_settings WHERE comodin_allowed = true`;
  if (allSettings.length > 0) {
    const allowed = allSettings.some((r) => r.match_id === matchId);
    if (!allowed) {
      return NextResponse.json({ error: "Este partido no permite comodín" }, { status: 400 });
    }
  }

  // Block comodín on a match that has doble
  const pred = await sql`
    SELECT outcome FROM planilla_predictions
    WHERE user_id = ${session.id} AND match_id = ${matchId}
  `;
  if (pred.length > 0 && (pred[0].outcome as string).length === 2) {
    return NextResponse.json({ error: "No se puede poner COMODÍN en un partido con DOBLE" }, { status: 400 });
  }

  await sql`
    INSERT INTO planilla_comodines (user_id, scope, match_id)
    VALUES (${session.id}, ${scope}, ${matchId})
    ON CONFLICT (user_id, scope)
    DO UPDATE SET match_id = ${matchId}, created_at = NOW()
  `;

  return NextResponse.json({ ok: true });
});

export const DELETE = withAuth(async (req, session) => {
  const { scope } = await req.json();
  if (!scope) return NextResponse.json({ error: "scope requerido" }, { status: 400 });

  if (await isScopeLocked(scope)) {
    return NextResponse.json({ error: "Comodines cerrados para esta fase" }, { status: 403 });
  }

  const sql = getDb();
  await sql`
    DELETE FROM planilla_comodines
    WHERE user_id = ${session.id} AND scope = ${scope}
  `;

  return NextResponse.json({ ok: true });
});
