import { NextResponse } from "next/server";
import { getResults } from "@/lib/resultsService";

export async function GET() {
  const results = await getResults();
  return NextResponse.json({ results });
}
