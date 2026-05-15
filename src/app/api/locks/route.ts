import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();
  const rows = await sql`SELECT scope, locks_at FROM lock_deadlines`;

  const now = Date.now();
  const locks: Record<string, { locksAt: string; isLocked: boolean }> = {};

  for (const row of rows) {
    const locksAt = row.locks_at as string;
    locks[row.scope as string] = {
      locksAt,
      isLocked: new Date(locksAt).getTime() <= now,
    };
  }

  return NextResponse.json({ locks });
}
