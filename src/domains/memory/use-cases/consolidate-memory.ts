import type { ConsolidationPipeline } from "../services/consolidation-pipeline";
import type { MemoryQueryService } from "../services/memory-query-service";
import { executeUseCase } from "@/domains/shared";

export class ConsolidateMemoryUseCase {
  constructor(
    private pipeline: ConsolidationPipeline,
    private queryService: MemoryQueryService
  ) {}

  execute() {
    return executeUseCase(() => {
      this.pipeline.runConsolidation();
      return this.queryService.getStats();
    });
  }
}
