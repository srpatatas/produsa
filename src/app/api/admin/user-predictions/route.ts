import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAdmin } from "@/lib/apiAuth";

export const GET = withAdmin(async (req, session) => {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

  const sql = getDb();

  const [predictions, comodines, bonus] = await Promise.all([
    sql`SELECT match_id, outcome FROM planilla_predictions WHERE user_id = ${userId} ORDER BY match_id`,
    sql`SELECT scope, match_id FROM planilla_comodines WHERE user_id = ${userId}`,
    sql`SELECT question_id, answer FROM bonus_predictions WHERE user_id = ${userId}`,
  ]);

  return NextResponse.json({ predictions, comodines, bonus });
});
