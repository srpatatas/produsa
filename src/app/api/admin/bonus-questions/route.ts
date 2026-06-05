import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAdmin } from "@/lib/apiAuth";

export const GET = withAdmin(async (req, session) => {
  const sql = getDb();
  const rows = await sql`SELECT id, label, subtitle, points, source_type, lock_scope, excluded_teams, team_filter, sort_order FROM bonus_questions ORDER BY sort_order, id`;

  const questions = rows.map((r) => ({
    id: r.id as string,
    label: r.label as string,
    subtitle: (r.subtitle as string) || undefined,
    points: (r.points as number) || 0,
    sourceType: r.source_type as string,
    lockScope: r.lock_scope as string,
    excludedTeams: (r.excluded_teams as string) || "",
    teamFilter: (r.team_filter as string) || "",
    sortOrder: r.sort_order as number,
  }));

  return NextResponse.json({ questions });
});

export const POST = withAdmin(async (req, session) => {
  const { id, label, subtitle, points, sourceType, lockScope, excludedTeams, teamFilter } = await req.json();
  const pointsNum = parseInt(points, 10) || 0;

  if (!id || !label || !sourceType || !lockScope) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  const validTypes = ["teams", "players", "participants", "exact_value"];
  if (!validTypes.includes(sourceType)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const sql = getDb();

  const maxSort = await sql`SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM bonus_questions WHERE lock_scope = ${lockScope}`;
  const sortOrder = maxSort[0].next as number;

  await sql`
    INSERT INTO bonus_questions (id, label, subtitle, points, source_type, lock_scope, excluded_teams, team_filter, sort_order)
    VALUES (${id}, ${label}, ${subtitle || null}, ${pointsNum}, ${sourceType}, ${lockScope}, ${excludedTeams || null}, ${teamFilter || null}, ${sortOrder})
    ON CONFLICT (id)
    DO UPDATE SET label = ${label}, subtitle = ${subtitle || null}, points = ${pointsNum}, source_type = ${sourceType}, lock_scope = ${lockScope}, excluded_teams = ${excludedTeams || null}, team_filter = ${teamFilter || null}, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
});

export const DELETE = withAdmin(async (req, session) => {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM bonus_predictions WHERE question_id = ${id}`;
  await sql`DELETE FROM bonus_results WHERE question_id = ${id}`;
  await sql`DELETE FROM bonus_questions WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
});
