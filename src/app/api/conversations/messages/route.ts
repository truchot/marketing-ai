import { NextRequest, NextResponse } from "next/server";
import { getHistoryUseCase, sendMessageUseCase } from "@/infrastructure/composition-root";

export async function GET() {
  const messages = getHistoryUseCase.execute();
  return NextResponse.json({ messages });
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

  return NextResponse.json(
    { messages: [result.userMessage, result.assistantMessage] },
    { status: 201 }
  );
}
