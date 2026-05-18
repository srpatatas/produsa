import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const sql = getDb();
  const rows = await sql`SELECT id, label, source_type, lock_scope, sort_order FROM bonus_questions ORDER BY sort_order, id`;

  const questions = rows.map((r) => ({
    id: r.id as string,
    label: r.label as string,
    sourceType: r.source_type as string,
    lockScope: r.lock_scope as string,
    sortOrder: r.sort_order as number,
  }));

  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id, label, sourceType, lockScope } = await req.json();

  if (!id || !label || !sourceType || !lockScope) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  const validTypes = ["teams", "players", "participants", "exact_value"];
  if (!validTypes.includes(sourceType)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const sql = getDb();

  const maxSort = await sql`SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM bonus_questions WHERE lock_scope = ${lockScope}`;
  const sortOrder = maxSort[0].next as number;

  await sql`
    INSERT INTO bonus_questions (id, label, source_type, lock_scope, sort_order)
    VALUES (${id}, ${label}, ${sourceType}, ${lockScope}, ${sortOrder})
    ON CONFLICT (id)
    DO UPDATE SET label = ${label}, source_type = ${sourceType}, lock_scope = ${lockScope}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM bonus_predictions WHERE question_id = ${id}`;
  await sql`DELETE FROM bonus_results WHERE question_id = ${id}`;
  await sql`DELETE FROM bonus_questions WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
