import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();

  const rows = await sql`
    SELECT DISTINCT ON (ps.user_id)
      ps.user_id, ps.score, ps.time_seconds, ps.lives_left, ps.revealed_pct,
      u.name, u.avatar
    FROM panic_scores ps
    JOIN users u ON u.id = ps.user_id
    ORDER BY ps.user_id, ps.score DESC
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
      timeSeconds: r.time_seconds as number,
      livesLeft: r.lives_left as number,
      revealedPct: r.revealed_pct as number,
    }));

  return NextResponse.json({ leaderboard });
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

  return NextResponse.json({ ok: true });
});
