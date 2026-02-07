import type { IEpisodicMemoryRepository } from "../ports";
import type { Feedback, FeedbackSentiment } from "@/types/memory";
import { Result, ValidationError } from "@/domains/shared";

interface RecordFeedbackInput {
  source: string;
  sentiment: FeedbackSentiment;
  content: string;
  taskId?: string;
}

export class RecordFeedbackUseCase {
  constructor(private episodicRepo: IEpisodicMemoryRepository) {}

  execute(input: RecordFeedbackInput): Result<Feedback> {
    try {
      const feedback = this.episodicRepo.recordFeedback(
        input.source,
        input.sentiment,
        input.content,
        input.taskId
      );
      return Result.ok(feedback);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown validation error"
      ));
    }
  }
}
