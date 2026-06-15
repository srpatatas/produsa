import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req, session) => {
  const matchId = req.nextUrl.searchParams.get("matchId");
  if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 });

  const sql = getDb();

  const [rows, exactRows, settingsRows, comodinRows] = await Promise.all([
    sql`
      SELECT u.id, u.name, u.avatar, p.outcome
      FROM planilla_predictions p
      JOIN users u ON u.id = p.user_id
      WHERE p.match_id = ${matchId} AND u.pin != 'PENDING'
      ORDER BY u.name
    `,
    sql`
      SELECT user_id, home_score, away_score
      FROM exact_score_predictions
      WHERE match_id = ${matchId}
    `,
    sql`SELECT 1 FROM match_settings WHERE match_id = ${matchId} AND exact_score = true`,
    sql`SELECT user_id FROM planilla_comodines WHERE match_id = ${matchId}`,
  ]);

  const exactByUser: Record<number, { home: number; away: number }> = {};
  for (const e of exactRows) {
    exactByUser[e.user_id as number] = {
      home: e.home_score as number,
      away: e.away_score as number,
    };
  }

  const comodinUserIds = new Set(comodinRows.map((r) => r.user_id as number));

  const predictions = rows.map((r) => ({
    user: { id: r.id as number, name: r.name as string, avatar: r.avatar as string },
    outcome: r.outcome as string,
    exactScore: exactByUser[r.id as number] ?? null,
    isComodin: comodinUserIds.has(r.id as number),
    isDoble: (r.outcome as string).length === 2,
  }));

  return NextResponse.json({
    predictions,
    exactScoreEnabled: settingsRows.length > 0,
  });
});
