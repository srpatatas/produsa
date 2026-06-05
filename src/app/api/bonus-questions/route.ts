import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();
  const rows = await sql`SELECT id, label, subtitle, points, source_type, lock_scope, excluded_teams, sort_order FROM bonus_questions ORDER BY sort_order, id`;

  const questions = rows.map((r) => ({
    id: r.id as string,
    label: r.label as string,
    subtitle: (r.subtitle as string) || undefined,
    points: (r.points as number) || 0,
    sourceType: r.source_type as string,
    lockScope: r.lock_scope as string,
    excludedTeams: (r.excluded_teams as string)?.split(",").filter(Boolean) || undefined,
  }));

  return NextResponse.json({ questions });
});
