import { NextRequest, NextResponse } from "next/server";
import { completeOnboardingUseCase } from "@/infrastructure/composition-root";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { answers, messages } = body;

  if (!answers || !answers.name || !answers.sector || !answers.description || !answers.target || !answers.brandTone) {
    return NextResponse.json(
      { error: "All answer fields are required." },
      { status: 400 }
    );
  }

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: "Messages array is required." },
      { status: 400 }
    );
  }

  const profile = completeOnboardingUseCase.execute(answers, messages);

  return NextResponse.json({ profile }, { status: 201 });
}
