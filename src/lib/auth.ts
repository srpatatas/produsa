import { cookies } from "next/headers";
import { getDb } from "./db";

const SESSION_COOKIE = "produsa_session";

export interface SessionUser {
  id: number;
  name: string;
  invite_code: string;
  avatar: string;
  is_admin: boolean;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(session.value, "base64").toString("utf-8"),
    );
    return payload as SessionUser;
  } catch {
    return null;
  }
}

export function createSessionToken(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

export async function getUserById(id: number): Promise<SessionUser | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name, invite_code, avatar, is_admin
    FROM users WHERE id = ${id}
  `;
  if (rows.length === 0) return null;
  return rows[0] as SessionUser;
}
