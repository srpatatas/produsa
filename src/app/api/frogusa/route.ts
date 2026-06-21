import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS frogusa_scores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  const rows = await sql`
    SELECT DISTINCT ON (s.user_id)
      s.user_id, s.score, s.created_at, u.name, u.avatar
    FROM frogusa_scores s
    JOIN users u ON u.id = s.user_id
    ORDER BY s.user_id, s.score DESC, s.created_at ASC
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

  return NextResponse.json({ leaderboard });
});

export const POST = withAuth(async (req, session) => {
  const { score } = await req.json();

  if (typeof score !== "number") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS frogusa_scores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    INSERT INTO frogusa_scores (user_id, score)
    VALUES (${session.id}, ${score})
  `;

  return NextResponse.json({ ok: true });
});
