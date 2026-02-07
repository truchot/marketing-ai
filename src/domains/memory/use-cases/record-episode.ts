import type { IEpisodicMemoryRepository } from "../ports";
import type { Episode, EpisodeType } from "@/types/memory";
import { EpisodeAggregate } from "../aggregates";
import { domainEventBus, Result, ValidationError } from "@/domains/shared";

interface RecordEpisodeInput {
  type: EpisodeType;
  description: string;
  data: Record<string, unknown>;
  tags: string[];
  importance: "low" | "medium" | "high";
}

export class RecordEpisodeUseCase {
  constructor(private episodicRepo: IEpisodicMemoryRepository) {}

  execute(input: RecordEpisodeInput): Result<Episode> {
    try {
      // Create rich aggregate - validates invariants and raises domain events
      const aggregate = EpisodeAggregate.create(
        input.type,
        input.description,
        input.data,
        { tags: input.tags, importance: input.importance }
      );

      // Publish domain events
      const events = aggregate.getUncommittedEvents();
      events.forEach(event => domainEventBus.publish(event));
      aggregate.clearUncommittedEvents();

      // Persist via repository using DTO
      const episode = this.episodicRepo.recordEpisode(
        aggregate.type,
        aggregate.description,
        aggregate.data,
        { tags: [...aggregate.tags], importance: aggregate.importanceLevel }
      );

      return Result.ok(episode);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown validation error"
      ));
    }
  }
}
