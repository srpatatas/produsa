import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isMatchLocked } from "@/lib/lockCheck";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sql = getDb();
  const rows = await sql`
    SELECT match_id, home_score, away_score FROM exact_score_predictions WHERE user_id = ${session.id}
  `;

  const predictions: Record<string, { homeScore: number; awayScore: number }> = {};
  for (const row of rows) {
    predictions[row.match_id as string] = {
      homeScore: row.home_score as number,
      awayScore: row.away_score as number,
    };
  }
  return NextResponse.json({ predictions });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { matchId, homeScore, awayScore } = await request.json() as {
    matchId: string;
    homeScore: number;
    awayScore: number;
  };

  if (!matchId || homeScore < 0 || awayScore < 0 || !Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (await isMatchLocked(matchId)) {
    return NextResponse.json({ error: "Partido cerrado" }, { status: 403 });
  }

  const sql = getDb();

  // Validate exact score is consistent with L/E/V prediction
  const predRows = await sql`
    SELECT outcome FROM planilla_predictions WHERE user_id = ${session.id} AND match_id = ${matchId}
  `;
  if (predRows.length === 0) {
    return NextResponse.json({ error: "Primero elegí L, E o V para este partido" }, { status: 400 });
  }
  const outcome = predRows[0].outcome as string;
  const scoreOutcome = homeScore > awayScore ? "L" : homeScore < awayScore ? "V" : "E";
  if (!outcome.includes(scoreOutcome)) {
    return NextResponse.json({ error: "El resultado exacto no coincide con tu predicción L/E/V" }, { status: 400 });
  }

  // Verify this match has exact_score enabled
  const settings = await sql`SELECT exact_score FROM match_settings WHERE match_id = ${matchId}`;
  if (settings.length === 0 || !settings[0].exact_score) {
    return NextResponse.json({ error: "Este partido no tiene resultado exacto habilitado" }, { status: 400 });
  }

  await sql`
    INSERT INTO exact_score_predictions (user_id, match_id, home_score, away_score)
    VALUES (${session.id}, ${matchId}, ${homeScore}, ${awayScore})
    ON CONFLICT (user_id, match_id) DO UPDATE SET home_score = ${homeScore}, away_score = ${awayScore}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { matchId } = await request.json() as { matchId: string };

  if (await isMatchLocked(matchId)) {
    return NextResponse.json({ error: "Partido cerrado" }, { status: 403 });
  }

  const sql = getDb();
  await sql`DELETE FROM exact_score_predictions WHERE user_id = ${session.id} AND match_id = ${matchId}`;

  return NextResponse.json({ ok: true });
}
