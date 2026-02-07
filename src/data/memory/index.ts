import { WorkingMemoryStore } from "./working-memory";
import { EpisodicMemoryStore } from "./episodic-memory";
import { SemanticMemoryStore } from "./semantic-memory";
import { ConsolidationPipeline } from "@/domains/memory/services/consolidation-pipeline";
import { MemoryQueryService } from "@/domains/memory/services/memory-query-service";

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

// Re-export classes for consumers that need them
export { WorkingMemoryStore } from "./working-memory";
export { EpisodicMemoryStore } from "./episodic-memory";
export { SemanticMemoryStore } from "./semantic-memory";
