import { WorkingMemoryStore } from "./working-memory";
import { EpisodicMemoryStore } from "./episodic-memory";
import { SemanticMemoryStore } from "./semantic-memory";
import { ConsolidationPipeline } from "./consolidation-pipeline";
import { MemoryQueryService } from "./memory-query-service";

// --- Singleton instances ---

export const workingMemory = new WorkingMemoryStore();
export const episodicMemory = new EpisodicMemoryStore();
export const semanticMemory = new SemanticMemoryStore();

export const consolidationPipeline = new ConsolidationPipeline(
  workingMemory,
  episodicMemory,
  semanticMemory
);

export const memoryQuery = new MemoryQueryService(
  workingMemory,
  episodicMemory,
  semanticMemory
);

// --- Backward-compatible facade ---
// Delegates to the appropriate module so existing consumers don't break.

export const memoryManager = {
  // Working memory
  startSession: (task: string, objective: string) =>
    workingMemory.startSession(task, objective),
  storeIntermediate: (key: string, data: unknown) =>
    workingMemory.storeIntermediate(key, data),
  updateAttention: (focus: string) =>
    workingMemory.updateAttention(focus),
  setScratchpad: (key: string, value: string) =>
    workingMemory.setScratchpad(key, value),
  getWorkingContext: () => workingMemory.getWorkingContext(),

  // Episodic memory
  recordEpisode: (
    ...args: Parameters<EpisodicMemoryStore["recordEpisode"]>
  ) => episodicMemory.recordEpisode(...args),
  recordFeedback: (
    ...args: Parameters<EpisodicMemoryStore["recordFeedback"]>
  ) => episodicMemory.recordFeedback(...args),
  recordTaskResult: (
    ...args: Parameters<EpisodicMemoryStore["recordTaskResult"]>
  ) => episodicMemory.recordTaskResult(...args),
  getEpisodicContext: () => episodicMemory.getEpisodicContext(),

  // Semantic memory
  addClientFact: (
    ...args: Parameters<SemanticMemoryStore["addClientFact"]>
  ) => semanticMemory.addClientFact(...args),
  addPreference: (
    ...args: Parameters<SemanticMemoryStore["addPreference"]>
  ) => semanticMemory.addPreference(...args),
  addValidatedPattern: (
    ...args: Parameters<SemanticMemoryStore["addValidatedPattern"]>
  ) => semanticMemory.addValidatedPattern(...args),
  addLearnedRule: (
    ...args: Parameters<SemanticMemoryStore["addLearnedRule"]>
  ) => semanticMemory.addLearnedRule(...args),
  getSemanticContext: () => semanticMemory.getSemanticContext(),

  // Query / transversal
  query: (...args: Parameters<MemoryQueryService["query"]>) =>
    memoryQuery.query(...args),
  getContextForTask: (taskType: string) =>
    memoryQuery.getContextForTask(taskType),
  getFullContext: () => memoryQuery.getFullContext(),
  getStats: () => memoryQuery.getStats(),

  // Consolidation
  runConsolidation: () => consolidationPipeline.runConsolidation(),
};

// Re-export classes for consumers that need them
export { WorkingMemoryStore } from "./working-memory";
export { EpisodicMemoryStore } from "./episodic-memory";
export { SemanticMemoryStore } from "./semantic-memory";
export { ConsolidationPipeline } from "./consolidation-pipeline";
export { MemoryQueryService } from "./memory-query-service";
