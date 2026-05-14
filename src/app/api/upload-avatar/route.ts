import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getDb } from "@/lib/db";
import { getSession, createSessionToken, SessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const targetUserId = formData.get("userId") as string | null;

  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Máximo 2MB" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Solo imágenes" }, { status: 400 });
  }

  // Admin can upload for other users
  const userId = targetUserId && session.is_admin ? parseInt(targetUserId, 10) : session.id;

  const ext = file.name.split(".").pop() || "jpg";
  const blob = await put(`avatars/${userId}-${Date.now()}.${ext}`, file, {
    access: "public",
  });

  const sql = getDb();
  await sql`UPDATE users SET avatar = ${blob.url} WHERE id = ${userId}`;

  // Update session cookie if updating own avatar
  if (userId === session.id) {
    const updatedUser: SessionUser = { ...session, avatar: blob.url };
    const token = createSessionToken(updatedUser);
    const response = NextResponse.json({ ok: true, url: blob.url });
    response.cookies.set("produsa_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ ok: true, url: blob.url });
}
