import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSessionToken, SessionUser } from "@/lib/auth";
import { withAuth } from "@/lib/apiAuth";

export const POST = withAuth(async (req, session) => {
  const { name } = await req.json();
  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const sql = getDb();
  const oldName = session.name;
  const newName = name.trim();
  await sql`UPDATE users SET name = ${newName} WHERE id = ${session.id}`;

  const participantQIds = await sql`SELECT id FROM bonus_questions WHERE source_type = 'participants'`;
  if (participantQIds.length > 0) {
    const qIds = participantQIds.map((r) => r.id as string);
    await sql`UPDATE bonus_predictions SET answer = ${newName} WHERE answer = ${oldName} AND question_id = ANY(${qIds})`;
  }

  const updatedUser: SessionUser = { ...session, name: newName };
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
});
