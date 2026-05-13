import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { fecha } = await req.json();
  if (!fecha) return NextResponse.json({ error: "fecha requerido" }, { status: 400 });

  const sql = getDb();
  await sql`
    DELETE FROM planilla_doubles
    WHERE user_id = ${session.id} AND fecha = ${fecha}
  `;

  return NextResponse.json({ ok: true });
}
