import type { IConversationRepository } from "@/domains/conversation/ports";
import type { ConversationMessage } from "@/types";
import { getMessages, addMessage, addMessages } from "./conversations";

export class InMemoryConversationRepository implements IConversationRepository {
  getAll(): ConversationMessage[] {
    return getMessages();
  }

  add(role: "user" | "assistant", content: string): ConversationMessage {
    return addMessage(role, content);
  }

  addBulk(
    msgs: { role: "user" | "assistant"; content: string }[]
  ): ConversationMessage[] {
    return addMessages(msgs);
  }
}

export const conversationRepository = new InMemoryConversationRepository();
