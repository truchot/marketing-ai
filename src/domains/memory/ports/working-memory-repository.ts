import type { WorkingSession, WorkingContext } from "@/types/memory";

export interface IWorkingMemoryRepository {
  startSession(task: string, objective: string): void;
  storeIntermediate(key: string, data: unknown): void;
  updateAttention(focus: string): void;
  setScratchpad(key: string, value: string): void;
  getWorkingContext(): WorkingContext;
  clearSession(): WorkingSession | null;
}
