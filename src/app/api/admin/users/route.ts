import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { withAdmin } from "@/lib/apiAuth";

export const GET = withAdmin(async (req, session) => {
  const sql = getDb();
  const users = await sql`
    SELECT id, name, invite_code, avatar, is_admin, pin != 'PENDING' as registered, created_at
    FROM users ORDER BY name
  `;

  return NextResponse.json({ users });
});

export const POST = withAdmin(async (req, session) => {
  const { name, inviteCode, avatar } = await req.json();

  if (!name || !inviteCode) {
    return NextResponse.json({ error: "Nombre y código requeridos" }, { status: 400 });
  }

  const sql = getDb();

  try {
    await sql`
      INSERT INTO users (name, invite_code, pin, avatar)
      VALUES (${name}, ${inviteCode.toUpperCase()}, 'PENDING', ${avatar || '⚽'})
    `;
  } catch {
    return NextResponse.json({ error: "El código ya existe" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
});

export const DELETE = withAdmin(async (req, session) => {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

  if (userId === session.id) {
    return NextResponse.json({ error: "No podés eliminarte a vos mismo" }, { status: 400 });
  }

  const sql = getDb();
  await sql`DELETE FROM users WHERE id = ${userId}`;

  return NextResponse.json({ ok: true });
});
