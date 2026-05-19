import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const GET = withAuth(async (req: NextRequest) => {
  const sql = getDb();
  const teamId = req.nextUrl.searchParams.get("teamId");

  const rows = teamId
    ? await sql`SELECT name, team_id, position, number FROM players WHERE team_id = ${teamId} ORDER BY name`
    : await sql`SELECT name, team_id, position, number FROM players ORDER BY team_id, name`;

  const players = rows.map((r) => ({
    name: r.name as string,
    teamId: r.team_id as string,
    position: (r.position as string) || undefined,
    number: (r.number as number) || undefined,
  }));

  return NextResponse.json({ players });
});
