import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { getDb } from "./db";

const SESSION_COOKIE = "produsa_session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET env var is required");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export interface SessionUser {
  id: number;
  name: string;
  invite_code: string;
  avatar: string;
  is_admin: boolean;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;

    const payloadB64 = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);

    const expected = sign(payloadB64);
    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadB64, "base64").toString("utf-8"),
    );

    if (payload.exp && Date.now() > payload.exp) return null;

    const { exp: _, ...user } = payload;
    return user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return null;
  return verifySessionToken(session.value);
}

export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = { ...user, exp: Date.now() + SESSION_MAX_AGE_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `${payloadB64}.${sign(payloadB64)}`;
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
