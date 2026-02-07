import type { IEpisodicMemoryRepository } from "../ports";
import type { Feedback, FeedbackSentiment } from "@/types/memory";

interface RecordFeedbackInput {
  source: string;
  sentiment: FeedbackSentiment;
  content: string;
  taskId?: string;
}

export class RecordFeedbackUseCase {
  constructor(private episodicRepo: IEpisodicMemoryRepository) {}

  execute(input: RecordFeedbackInput): Feedback {
    return this.episodicRepo.recordFeedback(
      input.source,
      input.sentiment,
      input.content,
      input.taskId
    );
  }
}
