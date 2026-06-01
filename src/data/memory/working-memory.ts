import { WorkingSession, WorkingContext } from "@/types/memory";
import type { IWorkingMemoryRepository } from "@/domains/memory/ports";

/**
 * In-memory working store. Kept as the test double for the Memory context.
 * Production uses the Prisma-backed implementation (see ./prisma-working-memory).
 */
export class WorkingMemoryStore implements IWorkingMemoryRepository {
  private workingSession: WorkingSession | null = null;

  async startSession(task: string, objective: string): Promise<void> {
    this.workingSession = {
      id: `session-${Date.now()}`,
      task,
      objective,
      startedAt: new Date().toISOString(),
      intermediateResults: {},
      scratchpad: {},
      attentionFocus: null,
    };
  }

  async storeIntermediate(key: string, data: unknown): Promise<void> {
    if (this.workingSession) {
      this.workingSession.intermediateResults[key] = data;
    }
  }

  async updateAttention(focus: string): Promise<void> {
    if (this.workingSession) {
      this.workingSession.attentionFocus = focus;
    }
  }

  async setScratchpad(key: string, value: string): Promise<void> {
    if (this.workingSession) {
      this.workingSession.scratchpad[key] = value;
    }
  }

  async getWorkingContext(): Promise<WorkingContext> {
    return { session: this.workingSession };
  }

  async clearSession(): Promise<WorkingSession | null> {
    const session = this.workingSession;
    this.workingSession = null;
    return session;
  }

  async reset(): Promise<void> {
    this.workingSession = null;
  }
}
