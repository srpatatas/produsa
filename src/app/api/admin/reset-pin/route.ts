import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAdmin } from "@/lib/apiAuth";

export const POST = withAdmin(async (req, session) => {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

  const sql = getDb();
  await sql`UPDATE users SET pin = 'PENDING' WHERE id = ${userId}`;

  return NextResponse.json({ ok: true });
});
