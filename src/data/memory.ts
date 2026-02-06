import {
  WorkingSession,
  WorkingContext,
  Episode,
  EpisodeType,
  Feedback,
  FeedbackSentiment,
  TaskResult,
  EmergentPattern,
  EpisodicContext,
  ClientFact,
  Preference,
  ConfidenceLevel,
  ValidatedPattern,
  LearnedRule,
  SemanticContext,
  MemoryQueryOptions,
  SearchResult,
  TaskContext,
  MemoryStats,
} from "@/types/memory";

const PATTERN_PROMOTION_THRESHOLD = 3;
const EPISODIC_RETENTION_DAYS = 30;

class MemoryManager {
  // --- Storage ---
  private workingSession: WorkingSession | null = null;
  private episodes: Episode[] = [];
  private feedback: Feedback[] = [];
  private taskResults: TaskResult[] = [];
  private emergentPatterns: EmergentPattern[] = [];
  private clientFacts: ClientFact[] = [];
  private preferences: Preference[] = [];
  private validatedPatterns: ValidatedPattern[] = [];
  private learnedRules: LearnedRule[] = [];

  // =====================
  // Working Memory
  // =====================

  startSession(task: string, objective: string): void {
    this.workingSession = {
      id: `session-${Date.now()}`,
      task,
      objective,
      startedAt: new Date().toISOString(),
      intermediateResults: {},
      scratchpad: {},
      attentionFocus: null,
    };
  }

  storeIntermediate(key: string, data: unknown): void {
    if (this.workingSession) {
      this.workingSession.intermediateResults[key] = data;
    }
  }

  updateAttention(focus: string): void {
    if (this.workingSession) {
      this.workingSession.attentionFocus = focus;
    }
  }

  setScratchpad(key: string, value: string): void {
    if (this.workingSession) {
      this.workingSession.scratchpad[key] = value;
    }
  }

  getWorkingContext(): WorkingContext {
    return { session: this.workingSession };
  }

  // =====================
  // Episodic Memory
  // =====================

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

  getEpisodicContext(): EpisodicContext {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - EPISODIC_RETENTION_DAYS);
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

  // =====================
  // Semantic Memory
  // =====================

  addClientFact(category: string, fact: string, source: string): ClientFact {
    const cf: ClientFact = {
      id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category,
      fact,
      source,
      addedAt: new Date().toISOString(),
    };
    this.clientFacts.push(cf);
    return cf;
  }

  addPreference(
    category: string,
    key: string,
    value: string,
    confidence: ConfidenceLevel
  ): Preference {
    const existing = this.preferences.find(
      (p) => p.category === category && p.key === key
    );
    if (existing) {
      existing.value = value;
      existing.confidence = confidence;
      return existing;
    }
    const pref: Preference = {
      id: `pref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category,
      key,
      value,
      confidence,
      addedAt: new Date().toISOString(),
    };
    this.preferences.push(pref);
    return pref;
  }

  addValidatedPattern(
    type: string,
    description: string,
    trigger: string,
    outcome: string,
    recommendation: string
  ): ValidatedPattern {
    const vp: ValidatedPattern = {
      id: `pat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      description,
      trigger,
      outcome,
      recommendation,
      validatedAt: new Date().toISOString(),
    };
    this.validatedPatterns.push(vp);
    return vp;
  }

  addLearnedRule(
    description: string,
    domain: string,
    action: string,
    confidence: ConfidenceLevel
  ): LearnedRule {
    const lr: LearnedRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      description,
      domain,
      action,
      confidence,
      addedAt: new Date().toISOString(),
    };
    this.learnedRules.push(lr);
    return lr;
  }

  getSemanticContext(): SemanticContext {
    return {
      clientFacts: [...this.clientFacts],
      preferences: [...this.preferences],
      validatedPatterns: [...this.validatedPatterns],
      learnedRules: [...this.learnedRules],
    };
  }

  // =====================
  // Transversal
  // =====================

  query(options: MemoryQueryOptions): SearchResult {
    const types = options.types || ["working", "episodic", "semantic"];
    const result: SearchResult = {
      working: null,
      episodic: null,
      semantic: null,
    };

    if (types.includes("working")) {
      result.working = this.getWorkingContext();
    }

    if (types.includes("episodic")) {
      const ctx = this.getEpisodicContext();
      if (options.tags && options.tags.length > 0) {
        result.episodic = {
          ...ctx,
          episodes: ctx.episodes.filter((e) =>
            options.tags!.some((tag) => e.metadata.tags.includes(tag))
          ),
        };
      } else {
        result.episodic = ctx;
      }
      if (options.limit && result.episodic.episodes) {
        result.episodic.episodes = result.episodic.episodes.slice(
          -options.limit
        );
      }
    }

    if (types.includes("semantic")) {
      const ctx = this.getSemanticContext();
      if (options.category) {
        result.semantic = {
          clientFacts: ctx.clientFacts.filter(
            (f) => f.category === options.category
          ),
          preferences: ctx.preferences.filter(
            (p) => p.category === options.category
          ),
          validatedPatterns: ctx.validatedPatterns.filter(
            (p) => p.type === options.category
          ),
          learnedRules: ctx.learnedRules.filter(
            (r) => r.domain === options.category
          ),
        };
      } else {
        result.semantic = ctx;
      }
    }

    return result;
  }

  getContextForTask(taskType: string): TaskContext {
    return {
      relevantFacts: this.clientFacts,
      relevantPreferences: this.preferences,
      recentEpisodes: this.episodes.slice(-10),
      patterns: this.validatedPatterns.filter((p) => p.type === taskType),
      rules: this.learnedRules.filter((r) => r.domain === taskType),
    };
  }

  runConsolidation(): void {
    this.consolidateWorkingToEpisodic();
    this.consolidateEpisodicToSemantic();
    this.pruneOldEpisodes();
  }

  getFullContext(): string {
    const semantic = this.getSemanticContext();
    const episodic = this.getEpisodicContext();
    const parts: string[] = [];

    if (semantic.clientFacts.length > 0) {
      parts.push("## Faits client");
      for (const f of semantic.clientFacts) {
        parts.push(`- [${f.category}] ${f.fact}`);
      }
    }

    if (semantic.preferences.length > 0) {
      parts.push("\n## Preferences");
      for (const p of semantic.preferences) {
        parts.push(`- ${p.key}: ${p.value} (${p.confidence})`);
      }
    }

    if (semantic.validatedPatterns.length > 0) {
      parts.push("\n## Patterns valides");
      for (const p of semantic.validatedPatterns) {
        parts.push(`- ${p.description} → ${p.recommendation}`);
      }
    }

    if (semantic.learnedRules.length > 0) {
      parts.push("\n## Regles apprises");
      for (const r of semantic.learnedRules) {
        parts.push(`- [${r.domain}] ${r.description}: ${r.action}`);
      }
    }

    if (episodic.episodes.length > 0) {
      const recent = episodic.episodes.slice(-5);
      parts.push("\n## Episodes recents");
      for (const e of recent) {
        parts.push(`- [${e.type}] ${e.description}`);
      }
    }

    return parts.join("\n");
  }

  getStats(): MemoryStats {
    return {
      working: { hasActiveSession: this.workingSession !== null },
      episodic: {
        episodes: this.episodes.length,
        feedback: this.feedback.length,
        taskResults: this.taskResults.length,
        emergentPatterns: this.emergentPatterns.length,
      },
      semantic: {
        facts: this.clientFacts.length,
        preferences: this.preferences.length,
        patterns: this.validatedPatterns.length,
        rules: this.learnedRules.length,
      },
    };
  }

  // =====================
  // Private helpers
  // =====================

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

  private consolidateWorkingToEpisodic(): void {
    if (!this.workingSession) return;

    const session = this.workingSession;
    const intermediateKeys = Object.keys(session.intermediateResults);
    const scratchpadKeys = Object.keys(session.scratchpad);

    if (intermediateKeys.length > 0 || scratchpadKeys.length > 0) {
      this.recordEpisode(
        "task_result",
        `Session: ${session.task} - ${session.objective}`,
        {
          intermediateResults: session.intermediateResults,
          scratchpad: session.scratchpad,
          duration:
            new Date().getTime() - new Date(session.startedAt).getTime(),
        },
        { tags: ["session", "consolidated"], importance: "medium" }
      );
    }

    this.workingSession = null;
  }

  private consolidateEpisodicToSemantic(): void {
    for (const pattern of this.emergentPatterns) {
      if (pattern.occurrences >= PATTERN_PROMOTION_THRESHOLD) {
        const alreadyValidated = this.validatedPatterns.some(
          (vp) => vp.type === pattern.type
        );
        if (!alreadyValidated) {
          this.addValidatedPattern(
            pattern.type,
            pattern.description,
            `Observed ${pattern.occurrences} times`,
            `From ${pattern.firstSeen} to ${pattern.lastSeen}`,
            `Pattern confirmed after ${pattern.occurrences} occurrences`
          );
        }
      }
    }

    // Promote recurring feedback to preferences
    const feedbackBySentiment = new Map<string, number>();
    for (const fb of this.feedback) {
      const key = `${fb.sentiment}:${fb.content.slice(0, 50)}`;
      feedbackBySentiment.set(
        key,
        (feedbackBySentiment.get(key) || 0) + 1
      );
    }
    for (const [key, count] of feedbackBySentiment) {
      if (count >= PATTERN_PROMOTION_THRESHOLD) {
        const [sentiment, content] = key.split(":");
        const alreadyPreference = this.preferences.some(
          (p) => p.key === content
        );
        if (!alreadyPreference) {
          this.addPreference(
            "feedback",
            content,
            `${sentiment} (${count} occurrences)`,
            "strong"
          );
        }
      }
    }
  }

  private pruneOldEpisodes(): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - EPISODIC_RETENTION_DAYS);
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
}

// Singleton instance
export const memoryManager = new MemoryManager();
