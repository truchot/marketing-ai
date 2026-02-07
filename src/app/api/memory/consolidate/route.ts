import { NextResponse } from "next/server";
import { consolidateMemoryUseCase } from "@/infrastructure/composition-root";

export async function POST() {
  const stats = consolidateMemoryUseCase.execute();
  return NextResponse.json({ success: true, stats });
}
