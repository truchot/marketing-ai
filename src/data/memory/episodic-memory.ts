import {
  Episode,
  EpisodeType,
  Feedback,
  FeedbackSentiment,
  TaskResult,
  EmergentPattern,
  EpisodicContext,
} from "@/types/memory";
import type { IEpisodicMemoryRepository } from "@/domains/memory/ports";

/**
 * In-memory episodic store. Kept as the test double for the Memory context
 * (the unit tests instantiate it directly). The production singleton uses the
 * Prisma-backed implementation — see ./prisma-episodic-memory.
 */
export class EpisodicMemoryStore implements IEpisodicMemoryRepository {
  private episodes: Episode[] = [];
  private feedback: Feedback[] = [];
  private taskResults: TaskResult[] = [];
  private emergentPatterns: EmergentPattern[] = [];

  async recordEpisode(
    type: EpisodeType,
    description: string,
    data: Record<string, unknown>,
    metadata: { tags: string[]; importance: "low" | "medium" | "high" }
  ): Promise<Episode> {
    const episode: Episode = {
      id: `ep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      description,
      data,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    };
    this.episodes.push(episode);
    this.detectPattern(episode);
    return episode;
  }

  async recordFeedback(
    source: string,
    sentiment: FeedbackSentiment,
    content: string,
    taskId?: string
  ): Promise<Feedback> {
    const fb: Feedback = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      source,
      sentiment,
      content,
      taskId,
      timestamp: new Date().toISOString(),
    };
    this.feedback.push(fb);
    return fb;
  }

  async recordTaskResult(result: {
    taskId: string;
    description: string;
    outcome: "success" | "partial" | "failure";
    data: Record<string, unknown>;
  }): Promise<TaskResult> {
    const tr: TaskResult = {
      id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...result,
      timestamp: new Date().toISOString(),
    };
    this.taskResults.push(tr);
    return tr;
  }

  async getEpisodicContext(retentionDays: number = 30): Promise<EpisodicContext> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffStr = cutoff.toISOString();

    return {
      episodes: this.episodes.filter((e) => e.metadata.timestamp >= cutoffStr),
      recentFeedback: this.feedback.filter((f) => f.timestamp >= cutoffStr),
      taskResults: this.taskResults.filter((t) => t.timestamp >= cutoffStr),
      emergentPatterns: [...this.emergentPatterns],
    };
  }

  async getEpisodes(): Promise<Episode[]> {
    return this.episodes;
  }

  async getFeedback(): Promise<Feedback[]> {
    return this.feedback;
  }

  async getEmergentPatterns(): Promise<EmergentPattern[]> {
    return this.emergentPatterns;
  }

  async prune(retentionDays: number): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffStr = cutoff.toISOString();

    this.episodes = this.episodes.filter((e) => e.metadata.timestamp >= cutoffStr);
    this.feedback = this.feedback.filter((f) => f.timestamp >= cutoffStr);
    this.taskResults = this.taskResults.filter((t) => t.timestamp >= cutoffStr);
  }

  async reset(): Promise<void> {
    this.episodes = [];
    this.feedback = [];
    this.taskResults = [];
    this.emergentPatterns = [];
  }

  private detectPattern(episode: Episode): void {
    const key = `${episode.type}:${episode.metadata.tags.sort().join(",")}`;
    const existing = this.emergentPatterns.find((p) => p.type === key);
    if (existing) {
      existing.occurrences++;
      existing.lastSeen = episode.metadata.timestamp;
    } else {
      this.emergentPatterns.push({
        id: `emrg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: key,
        description: `Pattern: ${episode.type} with tags [${episode.metadata.tags.join(", ")}]`,
        occurrences: 1,
        firstSeen: episode.metadata.timestamp,
        lastSeen: episode.metadata.timestamp,
      });
    }
  }
}
