import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const matchId = req.nextUrl.searchParams.get("matchId");
  if (!matchId) return NextResponse.json({ error: "matchId requerido" }, { status: 400 });

  const sql = getDb();
  const rows = await sql`
    SELECT u.id, u.name, u.avatar, p.outcome
    FROM planilla_predictions p
    JOIN users u ON u.id = p.user_id
    WHERE p.match_id = ${matchId} AND u.pin != 'PENDING'
    ORDER BY u.name
  `;

  const predictions = rows.map((r) => ({
    user: { id: r.id as number, name: r.name as string, avatar: r.avatar as string },
    outcome: r.outcome as string,
  }));

  return NextResponse.json({ predictions });
}
