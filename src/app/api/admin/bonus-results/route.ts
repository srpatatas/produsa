import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAdmin } from "@/lib/apiAuth";

export const GET = withAdmin(async (req, session) => {
  const sql = getDb();
  const rows = await sql`SELECT question_id, correct_answer FROM bonus_results ORDER BY question_id`;

  const results: Record<string, { correctAnswer: string }> = {};
  for (const row of rows) {
    results[row.question_id as string] = {
      correctAnswer: row.correct_answer as string,
    };
  }

  return NextResponse.json({ results });
});

export const POST = withAdmin(async (req, session) => {
  const { questionId, correctAnswer } = await req.json();

  if (!questionId || !correctAnswer) {
    return NextResponse.json({ error: "questionId y correctAnswer requeridos" }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    INSERT INTO bonus_results (question_id, correct_answer)
    VALUES (${questionId}, ${correctAnswer})
    ON CONFLICT (question_id)
    DO UPDATE SET correct_answer = ${correctAnswer}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
});

export const DELETE = withAdmin(async (req, session) => {
  const { questionId } = await req.json();
  if (!questionId) return NextResponse.json({ error: "questionId requerido" }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM bonus_results WHERE question_id = ${questionId}`;

  return NextResponse.json({ ok: true });
});
