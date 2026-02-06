import { NextRequest, NextResponse } from "next/server";
import { getMessages, addMessage } from "@/data/conversations";
import { memoryManager } from "@/data/memory";

const assistantResponses = [
  "C'est une excellente question ! Avec ce que je sais de votre entreprise, je vous recommande d'explorer cette direction. Voulez-vous qu'on approfondisse ensemble ?",
  "J'ai bien noté cette information. Cela m'aide à mieux comprendre vos besoins. Pouvez-vous me donner plus de détails sur ce point ?",
  "Très intéressant ! En tenant compte de votre secteur et de votre cible, je pense qu'une approche personnalisée serait la plus efficace ici.",
  "Merci pour ce retour. Je vais en tenir compte pour mes prochaines recommandations. Y a-t-il un aspect en particulier que vous aimeriez approfondir ?",
  "Bonne idée ! Je peux vous aider à structurer cela. Commençons par définir les objectifs principaux, puis nous établirons un plan d'action concret.",
];

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
  memoryManager.recordEpisode(
    "interaction",
    content,
    { messageId: userMessage.id, role: "user" },
    { tags: ["conversation", "user_message"], importance: "medium" }
  );

  // Generate assistant response
  const responseContent =
    assistantResponses[Math.floor(Math.random() * assistantResponses.length)];
  const assistantMessage = addMessage("assistant", responseContent);

  return NextResponse.json(
    { messages: [userMessage, assistantMessage] },
    { status: 201 }
  );
}
