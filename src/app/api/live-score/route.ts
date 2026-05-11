import { NextResponse } from "next/server";
import { fetchLiveScores } from "@/lib/liveScoreApi";

export async function GET() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return NextResponse.json({ scores: {} });
  }

  try {
    const scores = await fetchLiveScores(key);
    return NextResponse.json({ scores });
  } catch {
    return NextResponse.json({ scores: {} });
  }
}
