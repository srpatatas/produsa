import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();
  const rows = await sql`
    SELECT q.id, q.label, q.subtitle, q.points, q.source_type, q.lock_scope, q.excluded_teams, q.sort_order,
           r.points as result_points
    FROM bonus_questions q
    LEFT JOIN bonus_results r ON r.question_id = q.id
    ORDER BY q.sort_order, q.id
  `;

  const questions = rows.map((r) => ({
    id: r.id as string,
    label: r.label as string,
    subtitle: (r.subtitle as string) || undefined,
    points: (r.result_points as number) ?? (r.points as number) ?? 0,
    sourceType: r.source_type as string,
    lockScope: r.lock_scope as string,
    excludedTeams: (r.excluded_teams as string)?.split(",").filter(Boolean) || undefined,
  }));

  return NextResponse.json({ questions });
});
