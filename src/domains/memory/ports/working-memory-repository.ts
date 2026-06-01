import type { WorkingSession, WorkingContext } from "@/types/memory";

export interface IWorkingMemoryRepository {
  startSession(task: string, objective: string): Promise<void>;
  storeIntermediate(key: string, data: unknown): Promise<void>;
  updateAttention(focus: string): Promise<void>;
  setScratchpad(key: string, value: string): Promise<void>;
  getWorkingContext(): Promise<WorkingContext>;
  clearSession(): Promise<WorkingSession | null>;
  reset(): Promise<void>; // For testing
}
