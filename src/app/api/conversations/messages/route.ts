import { NextRequest, NextResponse } from "next/server";
import { getHistoryUseCase, sendMessageUseCase } from "@/infrastructure/composition-root";

export async function GET() {
  const result = getHistoryUseCase.execute();
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ messages: result.value });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== "string") {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  const result = sendMessageUseCase.execute(content);
  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.code === "VALIDATION_ERROR" ? 400 : 500 }
    );
  }

  return NextResponse.json(
    { messages: [result.value.userMessage, result.value.assistantMessage] },
    { status: 201 }
  );
}
