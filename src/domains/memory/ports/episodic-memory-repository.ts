import type {
  Episode,
  EpisodeType,
  Feedback,
  FeedbackSentiment,
  TaskResult,
  EmergentPattern,
  EpisodicContext,
} from "@/types/memory";

export interface IEpisodicMemoryRepository {
  recordEpisode(
    type: EpisodeType,
    description: string,
    data: Record<string, unknown>,
    metadata: { tags: string[]; importance: "low" | "medium" | "high" }
  ): Episode;

  recordFeedback(
    source: string,
    sentiment: FeedbackSentiment,
    content: string,
    taskId?: string
  ): Feedback;

  recordTaskResult(result: {
    taskId: string;
    description: string;
    outcome: "success" | "partial" | "failure";
    data: Record<string, unknown>;
  }): TaskResult;

  getEpisodicContext(retentionDays?: number): EpisodicContext;
  getEpisodes(): Episode[];
  getFeedback(): Feedback[];
  getEmergentPatterns(): EmergentPattern[];
  prune(retentionDays: number): void;
}
