import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

// MOCK: fake predictions for preview
const MOCK_PREDICTIONS: Record<string, { user: { id: number; name: string; avatar: string }; outcome: string }[]> = {
  "A-1": [
    { user: { id: 1, name: "srpatatas", avatar: "⚽" }, outcome: "L" },
    { user: { id: 2, name: "El Poeta", avatar: "🧉" }, outcome: "V" },
    { user: { id: 3, name: "Juanchi", avatar: "🦁" }, outcome: "L" },
    { user: { id: 9, name: "Hector Larrea", avatar: "🎸" }, outcome: "E" },
  ],
  "A-2": [
    { user: { id: 1, name: "srpatatas", avatar: "⚽" }, outcome: "V" },
    { user: { id: 2, name: "El Poeta", avatar: "🧉" }, outcome: "L" },
    { user: { id: 3, name: "Juanchi", avatar: "🦁" }, outcome: "E" },
    { user: { id: 9, name: "Hector Larrea", avatar: "🎸" }, outcome: "V" },
  ],
};

export const GET = withAuth(async (req, session) => {
  const matchId = req.nextUrl.searchParams.get("matchId");
  if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 });

  // MOCK: return fake predictions for preview matches
  if (MOCK_PREDICTIONS[matchId]) {
    return NextResponse.json({
      predictions: MOCK_PREDICTIONS[matchId],
      exactScoreEnabled: false,
    });
  }

  const sql = getDb();

  const [rows, exactRows, settingsRows] = await Promise.all([
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
  ]);

  const exactByUser: Record<number, { home: number; away: number }> = {};
  for (const e of exactRows) {
    exactByUser[e.user_id as number] = {
      home: e.home_score as number,
      away: e.away_score as number,
    };
  }

  const predictions = rows.map((r) => ({
    user: { id: r.id as number, name: r.name as string, avatar: r.avatar as string },
    outcome: r.outcome as string,
    exactScore: exactByUser[r.id as number] ?? null,
  }));

  return NextResponse.json({
    predictions,
    exactScoreEnabled: settingsRows.length > 0,
  });
});
