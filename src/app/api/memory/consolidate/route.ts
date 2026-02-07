import { NextResponse } from "next/server";
import { consolidateMemoryUseCase } from "@/infrastructure/composition-root";

export async function POST() {
  const result = consolidateMemoryUseCase.execute();
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, stats: result.value });
}
