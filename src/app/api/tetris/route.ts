import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

let lbCache: { data: unknown; time: number } | null = null;

export const GET = withAuth(async (req, session) => {
  if (lbCache && Date.now() - lbCache.time < 10_000) {
    return NextResponse.json(lbCache.data);
  }

  const sql = getDb();

  const rows = await sql`
    SELECT DISTINCT ON (ts.user_id)
      ts.user_id, ts.score, u.name, u.avatar
    FROM tetris_scores ts
    JOIN users u ON u.id = ts.user_id
    ORDER BY ts.user_id, ts.score DESC
  `;

  const leaderboard = rows
    .sort((a, b) => (b.score as number) - (a.score as number))
    .slice(0, 10)
    .map((r, i) => ({
      position: i + 1,
      userId: r.user_id as number,
      name: r.name as string,
      avatar: r.avatar as string,
      score: r.score as number,
    }));

  const response = { leaderboard };
  lbCache = { data: response, time: Date.now() };
  return NextResponse.json(response);
});

export const POST = withAuth(async (req, session) => {
  const { score } = await req.json();

  if (typeof score !== "number") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const sql = getDb();

  await sql`
    INSERT INTO tetris_scores (user_id, score)
    VALUES (${session.id}, ${score})
  `;

  lbCache = null;
  return NextResponse.json({ ok: true });
});
