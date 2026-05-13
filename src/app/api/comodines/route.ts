import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { scope, matchId } = await req.json();

  if (!scope || !matchId) {
    return NextResponse.json({ error: "scope y matchId requeridos" }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    INSERT INTO planilla_comodines (user_id, scope, match_id)
    VALUES (${session.id}, ${scope}, ${matchId})
    ON CONFLICT (user_id, scope)
    DO UPDATE SET match_id = ${matchId}, created_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { scope } = await req.json();
  if (!scope) return NextResponse.json({ error: "scope requerido" }, { status: 400 });

  const sql = getDb();
  await sql`
    DELETE FROM planilla_comodines
    WHERE user_id = ${session.id} AND scope = ${scope}
  `;

  return NextResponse.json({ ok: true });
}
