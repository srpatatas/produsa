import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT match_id, comodin_allowed, exact_score FROM match_settings`;

  const settings: Record<string, { comodinAllowed: boolean; exactScore: boolean }> = {};
  for (const row of rows) {
    settings[row.match_id as string] = {
      comodinAllowed: row.comodin_allowed as boolean,
      exactScore: row.exact_score as boolean,
    };
  }
  return NextResponse.json({ settings });
}
