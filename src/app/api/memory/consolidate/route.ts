import { NextResponse } from "next/server";
import { consolidationPipeline, memoryQuery } from "@/data/memory";

export async function POST() {
  consolidationPipeline.runConsolidation();
  const stats = memoryQuery.getStats();
  return NextResponse.json({ success: true, stats });
}
