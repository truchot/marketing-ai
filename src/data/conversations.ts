import { ConversationMessage } from "@/types";

const messages: ConversationMessage[] = [];

export function getMessages(): ConversationMessage[] {
  return [...messages];
}

export function addMessage(
  role: "user" | "assistant",
  content: string
): ConversationMessage {
  const msg: ConversationMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
  messages.push(msg);
  return msg;
}

export function addMessages(
  msgs: { role: "user" | "assistant"; content: string }[]
): ConversationMessage[] {
  return msgs.map((m) => addMessage(m.role, m.content));
}
