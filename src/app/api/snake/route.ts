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
    SELECT DISTINCT ON (ss.user_id)
      ss.user_id, ss.score, ss.created_at, u.name, u.avatar
    FROM snake_scores ss
    JOIN users u ON u.id = ss.user_id
    ORDER BY ss.user_id, ss.score DESC, ss.created_at ASC
  `;

  const leaderboard = rows
    .sort((a, b) => (b.score as number) - (a.score as number) || new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime())
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
    INSERT INTO snake_scores (user_id, score)
    VALUES (${session.id}, ${score})
  `;

  lbCache = null;
  return NextResponse.json({ ok: true });
});
