import type { MemoryStats } from "@/types/memory";
import type { ConsolidationPipeline } from "../services/consolidation-pipeline";
import type { MemoryQueryService } from "../services/memory-query-service";

export class ConsolidateMemoryUseCase {
  constructor(
    private pipeline: ConsolidationPipeline,
    private queryService: MemoryQueryService
  ) {}

  execute(): MemoryStats {
    this.pipeline.runConsolidation();
    return this.queryService.getStats();
  }
}
