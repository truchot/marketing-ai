import type { IConversationRepository } from "@/domains/conversation/ports";
import type { ConversationMessage } from "@/types";

/**
 * Standalone in-memory conversation repository for tests.
 * Each instance has its own isolated state (no shared globals).
 */
export class FakeConversationRepository implements IConversationRepository {
  private messages: ConversationMessage[] = [];
  private counter = 0;

  async getAll(): Promise<ConversationMessage[]> {
    return [...this.messages];
  }

  async add(role: "user" | "assistant", content: string): Promise<ConversationMessage> {
    this.counter += 1;
    const msg: ConversationMessage = {
      id: `msg-${this.counter}`,
      role,
      content,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    this.messages.push(msg);
    return msg;
  }

  async addBulk(
    msgs: { role: "user" | "assistant"; content: string }[]
  ): Promise<ConversationMessage[]> {
    const out: ConversationMessage[] = [];
    for (const m of msgs) {
      out.push(await this.add(m.role, m.content));
    }
    return out;
  }

  async reset(): Promise<void> {
    this.messages = [];
    this.counter = 0;
  }
}
