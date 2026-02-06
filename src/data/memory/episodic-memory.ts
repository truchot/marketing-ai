import {
  Episode,
  EpisodeType,
  Feedback,
  FeedbackSentiment,
  TaskResult,
  EmergentPattern,
  EpisodicContext,
} from "@/types/memory";

export class EpisodicMemoryStore {
  private episodes: Episode[] = [];
  private feedback: Feedback[] = [];
  private taskResults: TaskResult[] = [];
  private emergentPatterns: EmergentPattern[] = [];

  recordEpisode(
    type: EpisodeType,
    description: string,
    data: Record<string, unknown>,
    metadata: { tags: string[]; importance: "low" | "medium" | "high" }
  ): Episode {
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

  recordFeedback(
    source: string,
    sentiment: FeedbackSentiment,
    content: string,
    taskId?: string
  ): Feedback {
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

  recordTaskResult(result: {
    taskId: string;
    description: string;
    outcome: "success" | "partial" | "failure";
    data: Record<string, unknown>;
  }): TaskResult {
    const tr: TaskResult = {
      id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...result,
      timestamp: new Date().toISOString(),
    };
    this.taskResults.push(tr);
    return tr;
  }

  getEpisodicContext(retentionDays: number = 30): EpisodicContext {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffStr = cutoff.toISOString();

    return {
      episodes: this.episodes.filter(
        (e) => e.metadata.timestamp >= cutoffStr
      ),
      recentFeedback: this.feedback.filter(
        (f) => f.timestamp >= cutoffStr
      ),
      taskResults: this.taskResults.filter(
        (t) => t.timestamp >= cutoffStr
      ),
      emergentPatterns: [...this.emergentPatterns],
    };
  }

  getEpisodes(): Episode[] {
    return this.episodes;
  }

  getFeedback(): Feedback[] {
    return this.feedback;
  }

  getEmergentPatterns(): EmergentPattern[] {
    return this.emergentPatterns;
  }

  prune(retentionDays: number): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffStr = cutoff.toISOString();

    this.episodes = this.episodes.filter(
      (e) => e.metadata.timestamp >= cutoffStr
    );
    this.feedback = this.feedback.filter(
      (f) => f.timestamp >= cutoffStr
    );
    this.taskResults = this.taskResults.filter(
      (t) => t.timestamp >= cutoffStr
    );
  }

  private detectPattern(episode: Episode): void {
    const key = `${episode.type}:${episode.metadata.tags.sort().join(",")}`;
    const existing = this.emergentPatterns.find(
      (p) => p.type === key
    );
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
