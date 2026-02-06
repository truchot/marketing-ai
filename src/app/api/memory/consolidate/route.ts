import { NextResponse } from "next/server";
import { memoryManager } from "@/data/memory";

export async function POST() {
  memoryManager.runConsolidation();
  const stats = memoryManager.getStats();
  return NextResponse.json({ success: true, stats });
}
