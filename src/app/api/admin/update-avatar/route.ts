import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { userId, avatar } = await req.json();
  if (!userId || !avatar) return NextResponse.json({ error: "userId y avatar requeridos" }, { status: 400 });

  const sql = getDb();
  await sql`UPDATE users SET avatar = ${avatar} WHERE id = ${userId}`;

  return NextResponse.json({ ok: true });
}
