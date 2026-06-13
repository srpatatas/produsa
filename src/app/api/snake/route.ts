import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS snake_scores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  const rows = await sql`
    SELECT DISTINCT ON (ss.user_id)
      ss.user_id, ss.score, u.name, u.avatar
    FROM snake_scores ss
    JOIN users u ON u.id = ss.user_id
    ORDER BY ss.user_id, ss.score DESC
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

  return NextResponse.json({ leaderboard });
});

export const POST = withAuth(async (req, session) => {
  const { score } = await req.json();

  if (typeof score !== "number") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS snake_scores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    INSERT INTO snake_scores (user_id, score)
    VALUES (${session.id}, ${score})
  `;

  return NextResponse.json({ ok: true });
});
