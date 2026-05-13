import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession, createSessionToken, SessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { avatar } = await req.json();
  if (!avatar) return NextResponse.json({ error: "Avatar requerido" }, { status: 400 });

  const sql = getDb();
  await sql`UPDATE users SET avatar = ${avatar} WHERE id = ${session.id}`;

  const updatedUser: SessionUser = { ...session, avatar };
  const token = createSessionToken(updatedUser);

  const response = NextResponse.json({ ok: true, avatar });
  response.cookies.set("produsa_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });

  return response;
}
