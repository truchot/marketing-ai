import { NextRequest, NextResponse } from "next/server";
import { completeOnboardingUseCase } from "@/infrastructure/composition-root";
import { isBusinessDiscovery } from "@/agents/discovery";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { discovery, messages } = body;

  if (!discovery || !isBusinessDiscovery(discovery)) {
    return NextResponse.json(
      { error: "Valid BusinessDiscovery object is required." },
      { status: 400 }
    );
  }

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: "Messages array is required." },
      { status: 400 }
    );
  }

  const result = completeOnboardingUseCase.execute(discovery, messages);
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.code === "VALIDATION_ERROR" ? 400 : 500 }
    );
  }

  return NextResponse.json({ profile: result.value }, { status: 201 });
}
