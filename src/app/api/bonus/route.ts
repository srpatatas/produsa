import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isScopeLocked } from "@/lib/lockCheck";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sql = getDb();
  const rows = await sql`
    SELECT question_id, answer FROM bonus_predictions
    WHERE user_id = ${session.id}
  `;

  const predictions: Record<string, string> = {};
  for (const row of rows) {
    predictions[row.question_id as string] = row.answer as string;
  }

  return NextResponse.json({ predictions });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { questionId, answer } = await req.json();

  if (!questionId || !answer) {
    return NextResponse.json({ error: "questionId y answer requeridos" }, { status: 400 });
  }

  const sql = getDb();

  const questionRows = await sql`SELECT lock_scope FROM bonus_questions WHERE id = ${questionId}`;
  if (questionRows.length > 0 && await isScopeLocked(questionRows[0].lock_scope as string)) {
    return NextResponse.json({ error: "Puntos extra cerrados para esta fase" }, { status: 403 });
  }
  await sql`
    INSERT INTO bonus_predictions (user_id, question_id, answer)
    VALUES (${session.id}, ${questionId}, ${answer})
    ON CONFLICT (user_id, question_id)
    DO UPDATE SET answer = ${answer}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
