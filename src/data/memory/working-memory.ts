import { WorkingSession, WorkingContext } from "@/types/memory";
import type { IWorkingMemoryRepository } from "@/domains/memory/ports";

export class WorkingMemoryStore implements IWorkingMemoryRepository {
  private workingSession: WorkingSession | null = null;

  startSession(task: string, objective: string): void {
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

  storeIntermediate(key: string, data: unknown): void {
    if (this.workingSession) {
      this.workingSession.intermediateResults[key] = data;
    }
  }

  updateAttention(focus: string): void {
    if (this.workingSession) {
      this.workingSession.attentionFocus = focus;
    }
  }

  setScratchpad(key: string, value: string): void {
    if (this.workingSession) {
      this.workingSession.scratchpad[key] = value;
    }
  }

  getWorkingContext(): WorkingContext {
    return { session: this.workingSession };
  }

  clearSession(): WorkingSession | null {
    const session = this.workingSession;
    this.workingSession = null;
    return session;
  }
}
