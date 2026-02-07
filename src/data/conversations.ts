import { ConversationMessage } from "@/types";
import { IdGenerator } from "@/lib/id-generator";

const messages: ConversationMessage[] = [];

export function getMessages(): ConversationMessage[] {
  return [...messages];
}

export function addMessage(
  role: "user" | "assistant",
  content: string
): ConversationMessage {
  const msg: ConversationMessage = {
    id: IdGenerator.generate("msg"),
    role,
    content,
    createdAt: IdGenerator.timestamp(),
  };
  messages.push(msg);
  return msg;
}

export function addMessages(
  msgs: { role: "user" | "assistant"; content: string }[]
): ConversationMessage[] {
  return msgs.map((m) => addMessage(m.role, m.content));
}

export function resetConversations(): void {
  messages.length = 0;
}
