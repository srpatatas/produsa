import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAdmin } from "@/lib/apiAuth";

export const POST = withAdmin(async (req, session) => {
  const { userId, avatar } = await req.json();
  if (!userId || !avatar) return NextResponse.json({ error: "userId y avatar requeridos" }, { status: 400 });

  const sql = getDb();
  await sql`UPDATE users SET avatar = ${avatar} WHERE id = ${userId}`;

  return NextResponse.json({ ok: true });
});
