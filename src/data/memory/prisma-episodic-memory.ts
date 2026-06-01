// ============================================================
// PrismaEpisodicMemoryRepository
// episodes (data JSONB) + feedbacks + task_results + emergent_patterns.
// ============================================================

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { IdGenerator } from "@/lib/id-generator";
import type { IEpisodicMemoryRepository } from "@/domains/memory/ports";
import type {
  Episode,
  EpisodeType,
  Feedback,
  FeedbackSentiment,
  TaskResult,
  EmergentPattern,
  EpisodicContext,
} from "@/types/memory";

type Importance = "low" | "medium" | "high";

function episodeDto(r: {
  id: string;
  type: string;
  description: string;
  data: Prisma.JsonValue;
  tags: string[];
  importance: string;
  timestamp: string;
}): Episode {
  return {
    id: r.id,
    type: r.type as EpisodeType,
    description: r.description,
    data: r.data as unknown as Record<string, unknown>,
    metadata: { tags: r.tags, importance: r.importance as Importance, timestamp: r.timestamp },
  };
}

function feedbackDto(r: {
  id: string;
  source: string;
  sentiment: string;
  content: string;
  taskId: string | null;
  timestamp: string;
}): Feedback {
  return {
    id: r.id,
    source: r.source,
    sentiment: r.sentiment as FeedbackSentiment,
    content: r.content,
    taskId: r.taskId ?? undefined,
    timestamp: r.timestamp,
  };
}

function taskResultDto(r: {
  id: string;
  taskId: string;
  description: string;
  outcome: string;
  data: Prisma.JsonValue;
  timestamp: string;
}): TaskResult {
  return {
    id: r.id,
    taskId: r.taskId,
    description: r.description,
    outcome: r.outcome as TaskResult["outcome"],
    data: r.data as unknown as Record<string, unknown>,
    timestamp: r.timestamp,
  };
}

function patternDto(r: {
  id: string;
  type: string;
  description: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
}): EmergentPattern {
  return { ...r };
}

function cutoffISO(retentionDays: number): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  return cutoff.toISOString();
}

export class PrismaEpisodicMemoryRepository implements IEpisodicMemoryRepository {
  async recordEpisode(
    type: EpisodeType,
    description: string,
    data: Record<string, unknown>,
    metadata: { tags: string[]; importance: Importance }
  ): Promise<Episode> {
    const timestamp = IdGenerator.timestamp();
    const row = await prisma.episode.create({
      data: {
        id: IdGenerator.generate("ep"),
        type,
        description,
        data: data as Prisma.InputJsonValue,
        tags: metadata.tags,
        importance: metadata.importance,
        timestamp,
      },
    });
    await this.detectPattern(type, metadata.tags, timestamp);
    return episodeDto(row);
  }

  async recordFeedback(
    source: string,
    sentiment: FeedbackSentiment,
    content: string,
    taskId?: string
  ): Promise<Feedback> {
    const row = await prisma.feedback.create({
      data: {
        id: IdGenerator.generate("fb"),
        source,
        sentiment,
        content,
        taskId: taskId ?? null,
        timestamp: IdGenerator.timestamp(),
      },
    });
    return feedbackDto(row);
  }

  async recordTaskResult(result: {
    taskId: string;
    description: string;
    outcome: "success" | "partial" | "failure";
    data: Record<string, unknown>;
  }): Promise<TaskResult> {
    const row = await prisma.taskResult.create({
      data: {
        id: IdGenerator.generate("tr"),
        taskId: result.taskId,
        description: result.description,
        outcome: result.outcome,
        data: result.data as Prisma.InputJsonValue,
        timestamp: IdGenerator.timestamp(),
      },
    });
    return taskResultDto(row);
  }

  async getEpisodicContext(retentionDays: number = 30): Promise<EpisodicContext> {
    const cutoff = cutoffISO(retentionDays);
    const [episodes, recentFeedback, taskResults, emergentPatterns] = await Promise.all([
      prisma.episode.findMany({ where: { timestamp: { gte: cutoff } }, orderBy: { seq: "asc" } }),
      prisma.feedback.findMany({ where: { timestamp: { gte: cutoff } }, orderBy: { seq: "asc" } }),
      prisma.taskResult.findMany({ where: { timestamp: { gte: cutoff } }, orderBy: { seq: "asc" } }),
      prisma.emergentPattern.findMany(),
    ]);
    return {
      episodes: episodes.map(episodeDto),
      recentFeedback: recentFeedback.map(feedbackDto),
      taskResults: taskResults.map(taskResultDto),
      emergentPatterns: emergentPatterns.map(patternDto),
    };
  }

  async getEpisodes(): Promise<Episode[]> {
    const rows = await prisma.episode.findMany({ orderBy: { seq: "asc" } });
    return rows.map(episodeDto);
  }

  async getFeedback(): Promise<Feedback[]> {
    const rows = await prisma.feedback.findMany({ orderBy: { seq: "asc" } });
    return rows.map(feedbackDto);
  }

  async getEmergentPatterns(): Promise<EmergentPattern[]> {
    const rows = await prisma.emergentPattern.findMany();
    return rows.map(patternDto);
  }

  async prune(retentionDays: number): Promise<void> {
    const cutoff = cutoffISO(retentionDays);
    await prisma.$transaction([
      prisma.episode.deleteMany({ where: { timestamp: { lt: cutoff } } }),
      prisma.feedback.deleteMany({ where: { timestamp: { lt: cutoff } } }),
      prisma.taskResult.deleteMany({ where: { timestamp: { lt: cutoff } } }),
    ]);
  }

  async reset(): Promise<void> {
    await prisma.$transaction([
      prisma.episode.deleteMany({}),
      prisma.feedback.deleteMany({}),
      prisma.taskResult.deleteMany({}),
      prisma.emergentPattern.deleteMany({}),
    ]);
  }

  private async detectPattern(
    type: EpisodeType,
    tags: string[],
    timestamp: string
  ): Promise<void> {
    const key = `${type}:${[...tags].sort().join(",")}`;
    await prisma.emergentPattern.upsert({
      where: { type: key },
      update: { occurrences: { increment: 1 }, lastSeen: timestamp },
      create: {
        id: IdGenerator.generate("emrg"),
        type: key,
        description: `Pattern: ${type} with tags [${tags.join(", ")}]`,
        occurrences: 1,
        firstSeen: timestamp,
        lastSeen: timestamp,
      },
    });
  }
}
