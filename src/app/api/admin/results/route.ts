import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const sql = getDb();
  const rows = await sql`SELECT match_id, home_score, away_score FROM match_results ORDER BY match_id`;

  const results: Record<string, { matchId: string; homeScore: number; awayScore: number }> = {};
  for (const row of rows) {
    results[row.match_id as string] = {
      matchId: row.match_id as string,
      homeScore: row.home_score as number,
      awayScore: row.away_score as number,
    };
  }

  return NextResponse.json({ results });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { matchId, homeScore, awayScore } = await req.json();

  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return NextResponse.json({ error: "matchId, homeScore y awayScore requeridos" }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    INSERT INTO match_results (match_id, home_score, away_score)
    VALUES (${matchId}, ${homeScore}, ${awayScore})
    ON CONFLICT (match_id)
    DO UPDATE SET home_score = ${homeScore}, away_score = ${awayScore}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { matchId } = await req.json();
  if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM match_results WHERE match_id = ${matchId}`;

  return NextResponse.json({ ok: true });
}
