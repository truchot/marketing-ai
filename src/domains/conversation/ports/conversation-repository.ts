import type { ConversationMessage } from "@/types";

export interface IConversationRepository {
  getAll(): ConversationMessage[];
  add(role: "user" | "assistant", content: string): ConversationMessage;
  addBulk(
    msgs: { role: "user" | "assistant"; content: string }[]
  ): ConversationMessage[];
}
