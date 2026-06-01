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
  ): Promise<Episode>;

  recordFeedback(
    source: string,
    sentiment: FeedbackSentiment,
    content: string,
    taskId?: string
  ): Promise<Feedback>;

  recordTaskResult(result: {
    taskId: string;
    description: string;
    outcome: "success" | "partial" | "failure";
    data: Record<string, unknown>;
  }): Promise<TaskResult>;

  getEpisodicContext(retentionDays?: number): Promise<EpisodicContext>;
  getEpisodes(): Promise<Episode[]>;
  getFeedback(): Promise<Feedback[]>;
  getEmergentPatterns(): Promise<EmergentPattern[]>;
  prune(retentionDays: number): Promise<void>;
  reset(): Promise<void>; // For testing
}
