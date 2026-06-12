import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();

  const [questions, predictions, users, results] = await Promise.all([
    sql`SELECT id, label, subtitle, points, source_type, lock_scope, sort_order FROM bonus_questions ORDER BY sort_order, id`,
    sql`SELECT bp.user_id, bp.question_id, bp.answer FROM bonus_predictions bp`,
    sql`SELECT id, name, avatar FROM users WHERE pin != 'PENDING' ORDER BY name`,
    sql`SELECT question_id, correct_answer FROM bonus_results`,
  ]);

  const resultsMap: Record<string, string> = {};
  for (const r of results) {
    const answer = r.correct_answer as string;
    if (answer && answer !== "(pendiente)") {
      resultsMap[r.question_id as string] = answer;
    }
  }

  const predsByQuestion: Record<string, Array<{ userId: number; userName: string; avatar: string; answer: string }>> = {};
  const userMap = new Map(users.map((u) => [u.id as number, { name: u.name as string, avatar: u.avatar as string }]));

  for (const p of predictions) {
    const qid = p.question_id as string;
    if (!predsByQuestion[qid]) predsByQuestion[qid] = [];
    const user = userMap.get(p.user_id as number);
    if (user) {
      predsByQuestion[qid].push({
        userId: p.user_id as number,
        userName: user.name,
        avatar: user.avatar,
        answer: p.answer as string,
      });
    }
  }

  const data = questions.map((q) => {
    const preds = predsByQuestion[q.id as string] ?? [];
    const answerCounts: Record<string, Array<{ userId: number; userName: string; avatar: string }>> = {};
    for (const p of preds) {
      if (!answerCounts[p.answer]) answerCounts[p.answer] = [];
      answerCounts[p.answer].push({ userId: p.userId, userName: p.userName, avatar: p.avatar });
    }
    const grouped = Object.entries(answerCounts)
      .map(([answer, users]) => ({ answer, users, count: users.length }))
      .sort((a, b) => b.count - a.count);

    return {
      id: q.id as string,
      label: q.label as string,
      subtitle: (q.subtitle as string) || null,
      points: (q.points as number) || 0,
      sourceType: q.source_type as string,
      lockScope: q.lock_scope as string,
      correctAnswer: resultsMap[q.id as string] ?? null,
      totalPredictions: preds.length,
      grouped,
    };
  });

  const participants: Record<string, string> = {};
  for (const u of users) {
    participants[u.name as string] = u.avatar as string;
  }

  return NextResponse.json({ questions: data, totalUsers: users.length, participants });
});
