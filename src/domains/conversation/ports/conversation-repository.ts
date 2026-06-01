import type { ConversationMessage } from "@/types";

export interface IConversationRepository {
  getAll(): Promise<ConversationMessage[]>;
  add(role: "user" | "assistant", content: string): Promise<ConversationMessage>;
  addBulk(
    msgs: { role: "user" | "assistant"; content: string }[]
  ): Promise<ConversationMessage[]>;
  reset(): Promise<void>; // For testing
}
