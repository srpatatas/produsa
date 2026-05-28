import { NextResponse } from "next/server";
import { getScopeLockTime } from "@/lib/lockCheck";

const ALL_SCOPES = ["fecha-1", "fecha-2", "fecha-3", "R32", "R16", "QF", "SF", "FINAL"];

export async function GET() {
  const now = Date.now();
  const locks: Record<string, { locksAt: string; isLocked: boolean }> = {};

  for (const scope of ALL_SCOPES) {
    const locksAt = getScopeLockTime(scope);
    if (locksAt) {
      locks[scope] = {
        locksAt,
        isLocked: new Date(locksAt).getTime() <= now,
      };
    }
  }

  return NextResponse.json({ locks });
}
