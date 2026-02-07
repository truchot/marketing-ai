import type { MemoryQueryOptions, SearchResult, MemoryStats } from "@/types/memory";
import type { MemoryQueryService } from "../services/memory-query-service";
import { Result, ValidationError } from "@/domains/shared";

export class QueryMemoryUseCase {
  constructor(private queryService: MemoryQueryService) {}

  execute(options: MemoryQueryOptions): Result<{ memory: SearchResult; stats: MemoryStats }> {
    try {
      const memory = this.queryService.query(options);
      const stats = this.queryService.getStats();
      return Result.ok({ memory, stats });
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown query error"
      ));
    }
  }
}
