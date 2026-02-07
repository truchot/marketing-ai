import type { MemoryQueryOptions, SearchResult, MemoryStats } from "@/types/memory";
import type { MemoryQueryService } from "../services/memory-query-service";

export class QueryMemoryUseCase {
  constructor(private queryService: MemoryQueryService) {}

  execute(options: MemoryQueryOptions): { memory: SearchResult; stats: MemoryStats } {
    const memory = this.queryService.query(options);
    const stats = this.queryService.getStats();
    return { memory, stats };
  }
}
