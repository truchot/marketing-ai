import {
  MemoryQueryOptions,
  SearchResult,
  TaskContext,
  MemoryStats,
} from "@/types/memory";
import { WorkingMemoryStore } from "./working-memory";
import { EpisodicMemoryStore } from "./episodic-memory";
import { SemanticMemoryStore } from "./semantic-memory";

export class MemoryQueryService {
  constructor(
    private workingMemory: WorkingMemoryStore,
    private episodicMemory: EpisodicMemoryStore,
    private semanticMemory: SemanticMemoryStore
  ) {}

  query(options: MemoryQueryOptions): SearchResult {
    const types = options.types || ["working", "episodic", "semantic"];
    const result: SearchResult = {
      working: null,
      episodic: null,
      semantic: null,
    };

    if (types.includes("working")) {
      result.working = this.workingMemory.getWorkingContext();
    }

    if (types.includes("episodic")) {
      const ctx = this.episodicMemory.getEpisodicContext();
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
      const ctx = this.semanticMemory.getSemanticContext();
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
      relevantFacts: this.semanticMemory.getClientFacts(),
      relevantPreferences: this.semanticMemory.getPreferences(),
      recentEpisodes: this.episodicMemory.getEpisodes().slice(-10),
      patterns: this.semanticMemory.getValidatedPatterns().filter(
        (p) => p.type === taskType
      ),
      rules: this.semanticMemory.getLearnedRules().filter(
        (r) => r.domain === taskType
      ),
    };
  }

  getFullContext(): string {
    const semantic = this.semanticMemory.getSemanticContext();
    const episodic = this.episodicMemory.getEpisodicContext();
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
    const workingCtx = this.workingMemory.getWorkingContext();
    const episodicCtx = this.episodicMemory.getEpisodicContext();
    const semanticCtx = this.semanticMemory.getSemanticContext();

    return {
      working: { hasActiveSession: workingCtx.session !== null },
      episodic: {
        episodes: episodicCtx.episodes.length,
        feedback: episodicCtx.recentFeedback.length,
        taskResults: episodicCtx.taskResults.length,
        emergentPatterns: episodicCtx.emergentPatterns.length,
      },
      semantic: {
        facts: semanticCtx.clientFacts.length,
        preferences: semanticCtx.preferences.length,
        patterns: semanticCtx.validatedPatterns.length,
        rules: semanticCtx.learnedRules.length,
      },
    };
  }
}
