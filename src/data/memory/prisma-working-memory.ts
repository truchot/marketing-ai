// ============================================================
// PrismaWorkingMemoryRepository
// Single active session (0 or 1 row). intermediateResults +
// scratchpad stored as JSONB.
// ============================================================

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { IdGenerator } from "@/lib/id-generator";
import type { IWorkingMemoryRepository } from "@/domains/memory/ports";
import type { WorkingSession, WorkingContext } from "@/types/memory";

function sessionDto(r: {
  id: string;
  task: string;
  objective: string;
  startedAt: string;
  intermediateResults: Prisma.JsonValue;
  scratchpad: Prisma.JsonValue;
  attentionFocus: string | null;
}): WorkingSession {
  return {
    id: r.id,
    task: r.task,
    objective: r.objective,
    startedAt: r.startedAt,
    intermediateResults: r.intermediateResults as unknown as Record<string, unknown>,
    scratchpad: r.scratchpad as unknown as Record<string, string>,
    attentionFocus: r.attentionFocus,
  };
}

export class PrismaWorkingMemoryRepository implements IWorkingMemoryRepository {
  async startSession(task: string, objective: string): Promise<void> {
    // Only one active session at a time.
    await prisma.$transaction([
      prisma.workingSession.deleteMany({}),
      prisma.workingSession.create({
        data: {
          id: `session-${IdGenerator.timestamp()}`,
          task,
          objective,
          startedAt: IdGenerator.timestamp(),
          intermediateResults: {},
          scratchpad: {},
          attentionFocus: null,
        },
      }),
    ]);
  }

  async storeIntermediate(key: string, data: unknown): Promise<void> {
    const session = await prisma.workingSession.findFirst();
    if (!session) return;
    const current = (session.intermediateResults as unknown as Record<string, unknown>) ?? {};
    current[key] = data;
    await prisma.workingSession.update({
      where: { id: session.id },
      data: { intermediateResults: current as Prisma.InputJsonValue },
    });
  }

  async updateAttention(focus: string): Promise<void> {
    const session = await prisma.workingSession.findFirst();
    if (!session) return;
    await prisma.workingSession.update({
      where: { id: session.id },
      data: { attentionFocus: focus },
    });
  }

  async setScratchpad(key: string, value: string): Promise<void> {
    const session = await prisma.workingSession.findFirst();
    if (!session) return;
    const current = (session.scratchpad as unknown as Record<string, string>) ?? {};
    current[key] = value;
    await prisma.workingSession.update({
      where: { id: session.id },
      data: { scratchpad: current as Prisma.InputJsonValue },
    });
  }

  async getWorkingContext(): Promise<WorkingContext> {
    const session = await prisma.workingSession.findFirst();
    return { session: session ? sessionDto(session) : null };
  }

  async clearSession(): Promise<WorkingSession | null> {
    const session = await prisma.workingSession.findFirst();
    if (!session) return null;
    await prisma.workingSession.delete({ where: { id: session.id } });
    return sessionDto(session);
  }

  async reset(): Promise<void> {
    await prisma.workingSession.deleteMany({});
  }
}
