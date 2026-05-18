import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();
  const rows = await sql`
    SELECT fecha, match_id FROM planilla_doubles
    WHERE user_id = ${session.id}
  `;

  const doubles: Record<number, string> = {};
  for (const row of rows) {
    doubles[row.fecha as number] = row.match_id as string;
  }

  return NextResponse.json({ doubles });
});

export const POST = withAuth(async (req, session) => {
  const { fecha, matchId } = await req.json();

  if (!fecha || !matchId) {
    return NextResponse.json({ error: "fecha y matchId requeridos" }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    INSERT INTO planilla_doubles (user_id, fecha, match_id)
    VALUES (${session.id}, ${fecha}, ${matchId})
    ON CONFLICT (user_id, fecha)
    DO UPDATE SET match_id = ${matchId}, created_at = NOW()
  `;

  return NextResponse.json({ ok: true });
});

export const DELETE = withAuth(async (req, session) => {
  const { fecha } = await req.json();
  if (!fecha) return NextResponse.json({ error: "fecha requerido" }, { status: 400 });

  const sql = getDb();
  await sql`
    DELETE FROM planilla_doubles
    WHERE user_id = ${session.id} AND fecha = ${fecha}
  `;

  return NextResponse.json({ ok: true });
});
