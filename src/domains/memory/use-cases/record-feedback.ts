import type { IEpisodicMemoryRepository } from "../ports";
import type { FeedbackSentiment } from "@/types/memory";
import { domainEventBus, FEEDBACK_RECORDED, executeUseCase } from "@/domains/shared";

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
      const feedback = this.episodicRepo.recordFeedback(
        input.source,
        input.sentiment,
        input.content,
        input.taskId
      );

      domainEventBus.publish({
        type: FEEDBACK_RECORDED,
        occurredAt: new Date().toISOString(),
        payload: {
          feedbackId: feedback.id,
          sentiment: input.sentiment,
        },
      });

      return feedback;
    });
  }
}
