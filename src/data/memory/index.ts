import { PrismaWorkingMemoryRepository } from "./prisma-working-memory";
import { PrismaEpisodicMemoryRepository } from "./prisma-episodic-memory";
import { PrismaSemanticMemoryRepository } from "./prisma-semantic-memory";
import { ConsolidationPipeline } from "@/domains/memory/services/consolidation-pipeline";
import { MemoryQueryService } from "@/domains/memory/services/memory-query-service";

// --- Singleton instances (Postgres-backed) ---

export const workingMemory = new PrismaWorkingMemoryRepository();
export const episodicMemory = new PrismaEpisodicMemoryRepository();
export const semanticMemory = new PrismaSemanticMemoryRepository();

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

// In-memory store classes — used as test doubles by the unit tests.
export { WorkingMemoryStore } from "./working-memory";
export { EpisodicMemoryStore } from "./episodic-memory";
export { SemanticMemoryStore } from "./semantic-memory";
