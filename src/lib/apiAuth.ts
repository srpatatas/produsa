import { NextRequest, NextResponse } from "next/server";
import { getSession, SessionUser } from "./auth";

type AuthedHandler = (req: NextRequest, session: SessionUser) => Promise<NextResponse>;

export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return handler(req, session);
  };
}

export function withAdmin(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const session = await getSession();
    if (!session?.is_admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return handler(req, session);
  };
}
