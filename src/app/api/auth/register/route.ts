import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSessionToken, SessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { inviteCode, pin, name } = await req.json();

  if (!inviteCode || !pin || !name) {
    return NextResponse.json(
      { error: "Código, nombre y PIN requeridos" },
      { status: 400 },
    );
  }

  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { error: "El PIN debe ser de 4 dígitos" },
      { status: 400 },
    );
  }

  const sql = getDb();

  // Check if invite code exists and user hasn't registered yet
  const existing = await sql`
    SELECT id, pin FROM users WHERE invite_code = ${inviteCode.toUpperCase()}
  `;

  if (existing.length === 0) {
    return NextResponse.json(
      { error: "Código de invitación inválido" },
      { status: 401 },
    );
  }

  // If PIN is already set (not the placeholder), user already registered
  if (existing[0].pin !== "PENDING") {
    return NextResponse.json(
      { error: "Este código ya fue registrado. Usá el login." },
      { status: 409 },
    );
  }

  const hashedPin = await bcrypt.hash(pin, 10);

  const rows = await sql`
    UPDATE users
    SET name = ${name}, pin = ${hashedPin}
    WHERE invite_code = ${inviteCode.toUpperCase()}
    RETURNING id, name, invite_code, avatar, is_admin
  `;

  const user = rows[0];
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
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });

  return response;
}
