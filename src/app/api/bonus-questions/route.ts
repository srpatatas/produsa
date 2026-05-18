import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const GET = withAuth(async (req, session) => {
  const sql = getDb();
  const rows = await sql`SELECT id, label, source_type, lock_scope, sort_order FROM bonus_questions ORDER BY sort_order, id`;

  const questions = rows.map((r) => ({
    id: r.id as string,
    label: r.label as string,
    sourceType: r.source_type as string,
    lockScope: r.lock_scope as string,
  }));

  return NextResponse.json({ questions });
});
