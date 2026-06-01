import type { MemoryQueryOptions } from "@/types/memory";
import type { MemoryQueryService } from "../services/memory-query-service";
import { executeUseCase } from "@/domains/shared";

export class QueryMemoryUseCase {
  constructor(private queryService: MemoryQueryService) {}

  execute(options: MemoryQueryOptions) {
    return executeUseCase(async () => {
      const memory = await this.queryService.query(options);
      const stats = await this.queryService.getStats();
      return { memory, stats };
    });
  }
}
