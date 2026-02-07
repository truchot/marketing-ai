import { describe, it, expect } from "vitest";
import { RecordEpisodeUseCase } from "@/domains/memory/use-cases/record-episode";
import { EpisodicMemoryStore } from "../fakes";

describe("RecordEpisodeUseCase", () => {
  function setup() {
    const episodicRepo = new EpisodicMemoryStore();
    const useCase = new RecordEpisodeUseCase(episodicRepo);
    return { episodicRepo, useCase };
  }

  it("should record an episode with the correct data", () => {
    const { episodicRepo, useCase } = setup();

    const result = useCase.execute({
      type: "interaction",
      description: "User asked about pricing",
      data: { topic: "pricing" },
      tags: ["sales", "pricing"],
      importance: "high",
    });

    expect(result.isOk()).toBe(true);
    const episode = result.value;
    expect(episode.id).toBeDefined();
    expect(episode.type).toBe("interaction");
    expect(episode.description).toBe("User asked about pricing");
    expect(episode.data).toEqual({ topic: "pricing" });
    expect(episode.metadata.tags).toEqual(expect.arrayContaining(["sales", "pricing"]));
    expect(episode.metadata.importance).toBe("high");
    expect(episode.metadata.timestamp).toBeDefined();

    // Verify it was persisted in the repository
    const episodes = episodicRepo.getEpisodes();
    expect(episodes).toHaveLength(1);
    expect(episodes[0].id).toBe(episode.id);
  });

  it("should reject an invalid importance value", () => {
    const { useCase } = setup();

    const result = useCase.execute({
      type: "interaction",
      description: "Some episode",
      data: {},
      tags: ["test"],
      importance: "critical" as "low" | "medium" | "high",
    });

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("critical");
  });

  it("should reject an empty tag", () => {
    const { useCase } = setup();

    const result = useCase.execute({
      type: "interaction",
      description: "Some episode",
      data: {},
      tags: ["valid", "  "],
      importance: "low",
    });

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("empty");
  });

  it("should accept all valid episode types", () => {
    const { useCase } = setup();

    const types = ["interaction", "task_result", "feedback", "discovery"] as const;
    for (const type of types) {
      const result = useCase.execute({
        type,
        description: `Episode of type ${type}`,
        data: {},
        tags: ["test"],
        importance: "medium",
      });
      expect(result.isOk()).toBe(true);
      expect(result.value.type).toBe(type);
    }
  });
});
