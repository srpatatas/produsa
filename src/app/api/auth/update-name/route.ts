import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession, createSessionToken, SessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name } = await req.json();
  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const sql = getDb();
  await sql`UPDATE users SET name = ${name.trim()} WHERE id = ${session.id}`;

  const updatedUser: SessionUser = { ...session, name: name.trim() };
  const token = createSessionToken(updatedUser);

  const response = NextResponse.json({ ok: true });
  response.cookies.set("produsa_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });

  return response;
}
