import type { IEpisodicMemoryRepository } from "../ports";
import type { EpisodeType } from "@/types/memory";
import { EpisodeAggregate } from "../aggregates";
import { executeUseCase } from "@/domains/shared";

interface RecordEpisodeInput {
  type: EpisodeType;
  description: string;
  data: Record<string, unknown>;
  tags: string[];
  importance: "low" | "medium" | "high";
}

export class RecordEpisodeUseCase {
  constructor(private episodicRepo: IEpisodicMemoryRepository) {}

  execute(input: RecordEpisodeInput) {
    return executeUseCase(() => {
      const aggregate = EpisodeAggregate.create(
        input.type,
        input.description,
        input.data,
        { tags: input.tags, importance: input.importance }
      );
      aggregate.publishEvents();
      return this.episodicRepo.recordEpisode(
        aggregate.type,
        aggregate.description,
        aggregate.data,
        { tags: [...aggregate.tags], importance: aggregate.importanceLevel }
      );
    });
  }
}
