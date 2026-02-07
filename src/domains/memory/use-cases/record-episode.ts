import type { IEpisodicMemoryRepository } from "../ports";
import type { Episode, EpisodeType } from "@/types/memory";
import { Importance, Tag } from "@/domains/shared";

interface RecordEpisodeInput {
  type: EpisodeType;
  description: string;
  data: Record<string, unknown>;
  tags: string[];
  importance: "low" | "medium" | "high";
}

export class RecordEpisodeUseCase {
  constructor(private episodicRepo: IEpisodicMemoryRepository) {}

  execute(input: RecordEpisodeInput): Episode {
    // Validate via Value Objects
    Importance.create(input.importance);
    input.tags.forEach(t => Tag.create(t));

    return this.episodicRepo.recordEpisode(
      input.type,
      input.description,
      input.data,
      { tags: input.tags, importance: input.importance }
    );
  }
}
