import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAdmin } from "@/lib/apiAuth";

export const GET = withAdmin(async (req, session) => {
  const sql = getDb();
  const rows = await sql`SELECT question_id, correct_answer, scored FROM bonus_results ORDER BY question_id`;

  const results: Record<string, { correctAnswer: string; scored: boolean }> = {};
  for (const row of rows) {
    results[row.question_id as string] = {
      correctAnswer: row.correct_answer as string,
      scored: row.scored as boolean,
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
    INSERT INTO bonus_results (question_id, correct_answer, scored)
    VALUES (${questionId}, ${correctAnswer}, false)
    ON CONFLICT (question_id)
    DO UPDATE SET correct_answer = ${correctAnswer}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
});

export const PATCH = withAdmin(async (req, session) => {
  const { questionId, scored, scoreAll } = await req.json();

  const sql = getDb();

  if (scoreAll != null) {
    await sql`UPDATE bonus_results SET scored = ${!!scoreAll}, updated_at = NOW()`;
    return NextResponse.json({ ok: true });
  }

  if (!questionId || scored == null) {
    return NextResponse.json({ error: "questionId y scored requeridos" }, { status: 400 });
  }

  await sql`UPDATE bonus_results SET scored = ${!!scored}, updated_at = NOW() WHERE question_id = ${questionId}`;

  return NextResponse.json({ ok: true });
});

export const DELETE = withAdmin(async (req, session) => {
  const { questionId } = await req.json();
  if (!questionId) return NextResponse.json({ error: "questionId requerido" }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM bonus_results WHERE question_id = ${questionId}`;

  return NextResponse.json({ ok: true });
});
