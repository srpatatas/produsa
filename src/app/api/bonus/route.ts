import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";
import { isScopeLocked } from "@/lib/lockCheck";

export const GET = withAuth(async (req, session) => {
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
});

export const POST = withAuth(async (req, session) => {
  const { questionId, answer } = await req.json();

  if (!questionId || !answer) {
    return NextResponse.json({ error: "questionId y answer requeridos" }, { status: 400 });
  }

  const sql = getDb();

  const questionRows = await sql`SELECT lock_scope, excluded_teams, source_type FROM bonus_questions WHERE id = ${questionId}`;
  if (questionRows.length > 0 && await isScopeLocked(questionRows[0].lock_scope as string)) {
    return NextResponse.json({ error: "Puntos extra cerrados para esta fase" }, { status: 403 });
  }
  if (questionRows.length > 0 && questionRows[0].excluded_teams) {
    const excluded = (questionRows[0].excluded_teams as string).split(",");
    if (excluded.includes(answer)) {
      return NextResponse.json({ error: "Ese equipo no está permitido para esta pregunta" }, { status: 400 });
    }
  }
  if (questionRows.length > 0 && questionRows[0].source_type === "participants") {
    const userRows = await sql`SELECT name FROM users WHERE id = ${session.id}`;
    if (userRows.length > 0 && userRows[0].name === answer) {
      return NextResponse.json({ error: "No podés elegirte a vos mismo" }, { status: 400 });
    }
  }
  await sql`
    INSERT INTO bonus_predictions (user_id, question_id, answer)
    VALUES (${session.id}, ${questionId}, ${answer})
    ON CONFLICT (user_id, question_id)
    DO UPDATE SET answer = ${answer}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
});

export const DELETE = withAuth(async (req, session) => {
  const { questionId } = await req.json();
  if (!questionId) return NextResponse.json({ error: "questionId requerido" }, { status: 400 });

  const sql = getDb();

  const questionRows = await sql`SELECT lock_scope FROM bonus_questions WHERE id = ${questionId}`;
  if (questionRows.length > 0 && await isScopeLocked(questionRows[0].lock_scope as string)) {
    return NextResponse.json({ error: "Puntos extra cerrados para esta fase" }, { status: 403 });
  }

  await sql`DELETE FROM bonus_predictions WHERE user_id = ${session.id} AND question_id = ${questionId}`;
  return NextResponse.json({ ok: true });
});
