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

  async runConsolidation(): Promise<void> {
    await this.consolidateWorkingToEpisodic();
    await this.consolidateEpisodicToSemantic();
    await this.pruneOldEpisodes();
  }

  private async consolidateWorkingToEpisodic(): Promise<void> {
    const session = await this.workingMemory.clearSession();
    if (!session) return;

    const intermediateKeys = Object.keys(session.intermediateResults);
    const scratchpadKeys = Object.keys(session.scratchpad);

    if (intermediateKeys.length > 0 || scratchpadKeys.length > 0) {
      await this.episodicMemory.recordEpisode(
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

  private async consolidateEpisodicToSemantic(): Promise<void> {
    const patterns = await this.episodicMemory.getEmergentPatterns();
    for (const pattern of patterns) {
      if (pattern.occurrences >= PATTERN_PROMOTION_THRESHOLD) {
        const validatedPatterns = await this.semanticMemory.getValidatedPatterns();
        const alreadyValidated = validatedPatterns.some(
          (vp) => vp.type === pattern.type
        );
        if (!alreadyValidated) {
          await this.semanticMemory.addValidatedPattern(
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
    const allFeedback = await this.episodicMemory.getFeedback();
    for (const fb of allFeedback) {
      const key = `${fb.sentiment}:${fb.content.slice(0, 50)}`;
      feedbackBySentiment.set(
        key,
        (feedbackBySentiment.get(key) || 0) + 1
      );
    }
    for (const [key, count] of feedbackBySentiment) {
      if (count >= PATTERN_PROMOTION_THRESHOLD) {
        const [sentiment, content] = key.split(":");
        const preferences = await this.semanticMemory.getPreferences();
        const alreadyPreference = preferences.some(
          (p) => p.key === content
        );
        if (!alreadyPreference) {
          await this.semanticMemory.addPreference(
            "feedback",
            content,
            `${sentiment} (${count} occurrences)`,
            "strong"
          );
        }
      }
    }
  }

  private async pruneOldEpisodes(): Promise<void> {
    await this.episodicMemory.prune(EPISODIC_RETENTION_DAYS);
  }
}
