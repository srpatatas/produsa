import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const GET = withAuth(async () => {
  const sql = getDb();
  const rows = await sql`SELECT name FROM users WHERE pin != 'PENDING' ORDER BY name`;
  const participants = rows.map((r) => ({ name: r.name as string }));
  return NextResponse.json({ participants });
});
