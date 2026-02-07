import type { MemoryStats } from "@/types/memory";
import type { ConsolidationPipeline } from "../services/consolidation-pipeline";
import type { MemoryQueryService } from "../services/memory-query-service";
import { Result, ValidationError } from "@/domains/shared";

export class ConsolidateMemoryUseCase {
  constructor(
    private pipeline: ConsolidationPipeline,
    private queryService: MemoryQueryService
  ) {}

  execute(): Result<MemoryStats> {
    try {
      this.pipeline.runConsolidation();
      const stats = this.queryService.getStats();
      return Result.ok(stats);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown consolidation error"
      ));
    }
  }
}
