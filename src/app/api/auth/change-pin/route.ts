import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { withAuth } from "@/lib/apiAuth";

export const POST = withAuth(async (req, session) => {
  const { currentPin, newPin } = await req.json();

  if (!currentPin || !newPin) {
    return NextResponse.json({ error: "PIN actual y nuevo requeridos" }, { status: 400 });
  }

  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    return NextResponse.json({ error: "El PIN debe ser de 4 dígitos" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`SELECT pin FROM users WHERE id = ${session.id}`;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const pinValid = await bcrypt.compare(currentPin, rows[0].pin as string);
  if (!pinValid) {
    return NextResponse.json({ error: "PIN actual incorrecto" }, { status: 401 });
  }

  const hashedPin = await bcrypt.hash(newPin, 10);
  await sql`UPDATE users SET pin = ${hashedPin} WHERE id = ${session.id}`;

  return NextResponse.json({ ok: true });
});
