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
    SELECT DISTINCT ON (ps.user_id)
      ps.user_id, ps.score, ps.created_at, ps.time_seconds, ps.lives_left, ps.revealed_pct,
      u.name, u.avatar
    FROM panic_scores ps
    JOIN users u ON u.id = ps.user_id
    ORDER BY ps.user_id, ps.score DESC, ps.created_at ASC
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
      timeSeconds: r.time_seconds as number,
      livesLeft: r.lives_left as number,
      revealedPct: r.revealed_pct as number,
    }));

  const response = { leaderboard };
  lbCache = { data: response, time: Date.now() };
  return NextResponse.json(response);
});

export const POST = withAuth(async (req, session) => {
  const { score, timeSeconds, livesLeft, revealedPct } = await req.json();

  if (typeof score !== "number" || typeof timeSeconds !== "number") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const sql = getDb();

  await sql`
    INSERT INTO panic_scores (user_id, score, time_seconds, lives_left, revealed_pct)
    VALUES (${session.id}, ${score}, ${timeSeconds}, ${livesLeft}, ${revealedPct})
  `;

  lbCache = null;
  return NextResponse.json({ ok: true });
});
