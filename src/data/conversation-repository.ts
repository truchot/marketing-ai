import type { IConversationRepository } from "@/domains/conversation/ports";
import type { ConversationMessage } from "@/types";
import {
  getMessages,
  addMessage,
  addMessages,
  resetConversations,
} from "./conversations";

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

  reset(): void {
    resetConversations();
  }
}

// Shared via globalThis so all Next dev route bundles see the same history
// (see business-discovery-repository for the rationale).
const globalForConversation = globalThis as unknown as {
  __conversationRepository?: InMemoryConversationRepository;
};
export const conversationRepository =
  globalForConversation.__conversationRepository ??
  (globalForConversation.__conversationRepository =
    new InMemoryConversationRepository());
