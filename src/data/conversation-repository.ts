// ============================================================
// PrismaConversationRepository
// ============================================================

import { prisma } from "@/lib/prisma";
import { IdGenerator } from "@/lib/id-generator";
import type { IConversationRepository } from "@/domains/conversation/ports";
import type { ConversationMessage } from "@/types";

type Role = "user" | "assistant";

function toDto(r: { id: string; role: string; content: string; createdAt: string }): ConversationMessage {
  return { id: r.id, role: r.role as Role, content: r.content, createdAt: r.createdAt };
}

export class PrismaConversationRepository implements IConversationRepository {
  async getAll(): Promise<ConversationMessage[]> {
    const rows = await prisma.conversationMessage.findMany({ orderBy: { seq: "asc" } });
    return rows.map(toDto);
  }

  async add(role: Role, content: string): Promise<ConversationMessage> {
    const row = await prisma.conversationMessage.create({
      data: {
        id: IdGenerator.generate("msg"),
        role,
        content,
        createdAt: IdGenerator.timestamp(),
      },
    });
    return toDto(row);
  }

  async addBulk(msgs: { role: Role; content: string }[]): Promise<ConversationMessage[]> {
    const out: ConversationMessage[] = [];
    for (const m of msgs) {
      out.push(await this.add(m.role, m.content));
    }
    return out;
  }

  async reset(): Promise<void> {
    await prisma.conversationMessage.deleteMany({});
  }
}

export const conversationRepository = new PrismaConversationRepository();
