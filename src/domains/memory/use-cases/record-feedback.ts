import type { IEpisodicMemoryRepository } from "../ports";
import type { FeedbackSentiment } from "@/types/memory";
import { executeUseCase } from "@/domains/shared";

interface RecordFeedbackInput {
  source: string;
  sentiment: FeedbackSentiment;
  content: string;
  taskId?: string;
}

export class RecordFeedbackUseCase {
  constructor(private episodicRepo: IEpisodicMemoryRepository) {}

  execute(input: RecordFeedbackInput) {
    return executeUseCase(() => {
      return this.episodicRepo.recordFeedback(
        input.source,
        input.sentiment,
        input.content,
        input.taskId
      );
    });
  }
}
