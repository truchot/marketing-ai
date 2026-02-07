import type { IWorkingMemoryRepository } from "../ports/working-memory-repository";
import type { IEpisodicMemoryRepository } from "../ports/episodic-memory-repository";
import type { ISemanticMemoryRepository } from "../ports/semantic-memory-repository";

const PATTERN_PROMOTION_THRESHOLD = 3;
const EPISODIC_RETENTION_DAYS = 30;

export class ConsolidationPipeline {
  constructor(
    private workingMemory: IWorkingMemoryRepository,
    private episodicMemory: IEpisodicMemoryRepository,
    private semanticMemory: ISemanticMemoryRepository
  ) {}

  runConsolidation(): void {
    this.consolidateWorkingToEpisodic();
    this.consolidateEpisodicToSemantic();
    this.pruneOldEpisodes();
  }

  private consolidateWorkingToEpisodic(): void {
    const session = this.workingMemory.clearSession();
    if (!session) return;

    const intermediateKeys = Object.keys(session.intermediateResults);
    const scratchpadKeys = Object.keys(session.scratchpad);

    if (intermediateKeys.length > 0 || scratchpadKeys.length > 0) {
      this.episodicMemory.recordEpisode(
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
  }

  private consolidateEpisodicToSemantic(): void {
    for (const pattern of this.episodicMemory.getEmergentPatterns()) {
      if (pattern.occurrences >= PATTERN_PROMOTION_THRESHOLD) {
        const validatedPatterns = this.semanticMemory.getValidatedPatterns();
        const alreadyValidated = validatedPatterns.some(
          (vp) => vp.type === pattern.type
        );
        if (!alreadyValidated) {
          this.semanticMemory.addValidatedPattern(
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
    for (const fb of this.episodicMemory.getFeedback()) {
      const key = `${fb.sentiment}:${fb.content.slice(0, 50)}`;
      feedbackBySentiment.set(
        key,
        (feedbackBySentiment.get(key) || 0) + 1
      );
    }
    for (const [key, count] of feedbackBySentiment) {
      if (count >= PATTERN_PROMOTION_THRESHOLD) {
        const [sentiment, content] = key.split(":");
        const preferences = this.semanticMemory.getPreferences();
        const alreadyPreference = preferences.some(
          (p) => p.key === content
        );
        if (!alreadyPreference) {
          this.semanticMemory.addPreference(
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
    this.episodicMemory.prune(EPISODIC_RETENTION_DAYS);
  }
}
