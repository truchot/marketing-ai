import { NextResponse } from "next/server";
import { getChannelCacUseCase } from "@/infrastructure/composition-root";

export const runtime = "nodejs";

// GET /api/metrics/cac-by-channel
// Returns the CAC-per-channel report from the first configured live connector,
// or a discovery-derived estimate as fallback (flagged `estimated: true`).
export async function GET() {
  const result = await getChannelCacUseCase.execute();
  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json(result.value);
}
