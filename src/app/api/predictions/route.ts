import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isMatchLocked } from "@/lib/lockCheck";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sql = getDb();
  const rows = await sql`
    SELECT match_id, outcome FROM planilla_predictions
    WHERE user_id = ${session.id}
  `;

  const predictions: Record<string, { matchId: string; outcome: string }> = {};
  for (const row of rows) {
    predictions[row.match_id as string] = {
      matchId: row.match_id as string,
      outcome: row.outcome as string,
    };
  }

  return NextResponse.json({ predictions });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { matchId, outcome } = await req.json();

  if (!matchId || !outcome) {
    return NextResponse.json({ error: "matchId y outcome requeridos" }, { status: 400 });
  }

  const validOutcomes = ["L", "E", "V", "LE", "EL", "EV", "VE", "LV", "VL"];
  if (!validOutcomes.includes(outcome)) {
    return NextResponse.json({ error: "Outcome inválido" }, { status: 400 });
  }

  if (await isMatchLocked(matchId)) {
    return NextResponse.json({ error: "Predicciones cerradas para este partido" }, { status: 403 });
  }

  const sql = getDb();
  await sql`
    INSERT INTO planilla_predictions (user_id, match_id, outcome)
    VALUES (${session.id}, ${matchId}, ${outcome})
    ON CONFLICT (user_id, match_id)
    DO UPDATE SET outcome = ${outcome}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { matchId } = await req.json();
  if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 });

  if (await isMatchLocked(matchId)) {
    return NextResponse.json({ error: "Predicciones cerradas para este partido" }, { status: 403 });
  }

  const sql = getDb();
  await sql`
    DELETE FROM planilla_predictions
    WHERE user_id = ${session.id} AND match_id = ${matchId}
  `;

  return NextResponse.json({ ok: true });
}
