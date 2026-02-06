import { NextRequest, NextResponse } from "next/server";
import { getMessages, addMessage } from "@/data/conversations";
import { episodicMemory } from "@/data/memory";
import { conversationResponses, pickRandom } from "@/lib/assistant-responses";

export async function GET() {
  const messages = getMessages();
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

  const userMessage = addMessage("user", content);

  // Record in episodic memory
  episodicMemory.recordEpisode(
    "interaction",
    content,
    { messageId: userMessage.id, role: "user" },
    { tags: ["conversation", "user_message"], importance: "medium" }
  );

  // Generate assistant response
  const responseContent = pickRandom(conversationResponses);
  const assistantMessage = addMessage("assistant", responseContent);

  return NextResponse.json(
    { messages: [userMessage, assistantMessage] },
    { status: 201 }
  );
}
