import type { IConversationRepository } from "@/domains/conversation/ports";
import type { ConversationMessage } from "@/types";

/**
 * Standalone in-memory conversation repository for tests.
 * Each instance has its own isolated state (no shared globals).
 */
export class FakeConversationRepository implements IConversationRepository {
  private messages: ConversationMessage[] = [];
  private counter = 0;

  getAll(): ConversationMessage[] {
    return [...this.messages];
  }

  add(role: "user" | "assistant", content: string): ConversationMessage {
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

  addBulk(
    msgs: { role: "user" | "assistant"; content: string }[]
  ): ConversationMessage[] {
    return msgs.map((m) => this.add(m.role, m.content));
  }

  reset(): void {
    this.messages = [];
    this.counter = 0;
  }
}
