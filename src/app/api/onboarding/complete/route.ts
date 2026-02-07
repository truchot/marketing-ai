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

  const profile = completeOnboardingUseCase.execute(discovery, messages);

  return NextResponse.json({ profile }, { status: 201 });
}
