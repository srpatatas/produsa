import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const sql = getDb();
  const rows = await sql`SELECT question_id, correct_answer, points FROM bonus_results ORDER BY question_id`;

  const results: Record<string, { correctAnswer: string; points: number }> = {};
  for (const row of rows) {
    results[row.question_id as string] = {
      correctAnswer: row.correct_answer as string,
      points: row.points as number,
    };
  }

  return NextResponse.json({ results });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { questionId, correctAnswer, points } = await req.json();

  if (!questionId || !correctAnswer || points === undefined) {
    return NextResponse.json({ error: "questionId, correctAnswer y points requeridos" }, { status: 400 });
  }

  if (typeof points !== "number" || points < 0) {
    return NextResponse.json({ error: "points debe ser un número positivo" }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    INSERT INTO bonus_results (question_id, correct_answer, points)
    VALUES (${questionId}, ${correctAnswer}, ${points})
    ON CONFLICT (question_id)
    DO UPDATE SET correct_answer = ${correctAnswer}, points = ${points}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { questionId } = await req.json();
  if (!questionId) return NextResponse.json({ error: "questionId requerido" }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM bonus_results WHERE question_id = ${questionId}`;

  return NextResponse.json({ ok: true });
}
