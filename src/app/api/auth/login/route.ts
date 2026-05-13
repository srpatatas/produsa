import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSessionToken, SessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { inviteCode, pin } = await req.json();

  if (!inviteCode || !pin) {
    return NextResponse.json(
      { error: "Código y PIN requeridos" },
      { status: 400 },
    );
  }

  const sql = getDb();
  const rows = await sql`
    SELECT id, name, invite_code, pin, avatar, is_admin
    FROM users WHERE invite_code = ${inviteCode.toUpperCase()}
  `;

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Código de invitación inválido" },
      { status: 401 },
    );
  }

  const user = rows[0];
  const pinValid = await bcrypt.compare(pin, user.pin);

  if (!pinValid) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  }

  const sessionUser: SessionUser = {
    id: user.id as number,
    name: user.name as string,
    invite_code: user.invite_code as string,
    avatar: user.avatar as string,
    is_admin: user.is_admin as boolean,
  };

  const token = createSessionToken(sessionUser);
  const response = NextResponse.json({ user: sessionUser });

  response.cookies.set("produsa_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90, // 90 days
    path: "/",
  });

  return response;
}
