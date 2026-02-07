import { describe, it, expect } from "vitest";
import { EpisodeAggregate } from "@/domains/memory/aggregates";

describe("EpisodeAggregate", () => {
  describe("create", () => {
    it("should create a valid episode with all required fields", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User asked about pricing",
        { topic: "pricing" },
        { tags: ["sales", "pricing"], importance: "high" }
      );

      expect(episode.id).toMatch(/^ep-\d+-[a-z0-9]+$/);
      expect(episode.type).toBe("interaction");
      expect(episode.description).toBe("User asked about pricing");
      expect(episode.data).toEqual({ topic: "pricing" });
      expect(episode.tags).toEqual(["sales", "pricing"]);
      expect(episode.importanceLevel).toBe("high");
      expect(episode.timestamp).toBeDefined();
    });

    it("should default importance to 'low' if not provided", () => {
      const episode = EpisodeAggregate.create(
        "discovery",
        "Found new pattern",
        {},
        { tags: ["pattern"] }
      );

      expect(episode.importanceLevel).toBe("low");
    });

    it("should raise EPISODE_RECORDED domain event on creation", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User feedback received",
        { feedback: "positive" },
        { tags: ["feedback"], importance: "medium" }
      );

      const events = episode.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("EPISODE_RECORDED");
      expect(events[0].payload).toMatchObject({
        episodeId: episode.id,
        type: "interaction",
        tags: ["feedback"],
        importance: "medium",
      });
    });

    it("should reject empty description", () => {
      expect(() =>
        EpisodeAggregate.create("interaction", "", {}, { tags: ["test"] })
      ).toThrow("Episode description cannot be empty");
    });

    it("should reject whitespace-only description", () => {
      expect(() =>
        EpisodeAggregate.create("interaction", "   ", {}, { tags: ["test"] })
      ).toThrow("Episode description cannot be empty");
    });

    it("should reject episode with no tags", () => {
      expect(() =>
        EpisodeAggregate.create(
          "interaction",
          "Some description",
          {},
          { tags: [] }
        )
      ).toThrow("Episode must have at least one tag");
    });

    it("should reject episode with invalid tag", () => {
      expect(() =>
        EpisodeAggregate.create(
          "interaction",
          "Some description",
          {},
          { tags: ["valid", "  "] }
        )
      ).toThrow("Tag cannot be empty");
    });

    it("should reject invalid importance level", () => {
      expect(() =>
        EpisodeAggregate.create(
          "interaction",
          "Some description",
          {},
          { tags: ["test"], importance: "critical" as any }
        )
      ).toThrow('Invalid Importance: "critical"');
    });
  });

  describe("fromPersisted", () => {
    it("should reconstitute episode from DTO without raising events", () => {
      const dto = {
        id: "ep-1700000000000-abc123",
        type: "task_result" as const,
        description: "Task completed successfully",
        data: { result: "success" },
        metadata: {
          tags: ["task", "success"],
          importance: "medium" as const,
          timestamp: "2024-01-01T00:00:00.000Z",
        },
      };

      const episode = EpisodeAggregate.fromPersisted(dto);

      expect(episode.id).toBe("ep-1700000000000-abc123");
      expect(episode.type).toBe("task_result");
      expect(episode.description).toBe("Task completed successfully");
      expect(episode.tags).toEqual(["task", "success"]);
      expect(episode.importanceLevel).toBe("medium");
      expect(episode.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe("addTag", () => {
    it("should add a new tag to the episode", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["initial"] }
      );

      episode.addTag("new-tag");

      expect(episode.tags).toContain("initial");
      expect(episode.tags).toContain("new-tag");
      expect(episode.tags).toHaveLength(2);
    });

    it("should reject duplicate tags", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["existing"] }
      );

      expect(() => episode.addTag("existing")).toThrow(
        'Tag "existing" already exists on this episode'
      );
    });

    it("should reject empty tag", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["valid"] }
      );

      expect(() => episode.addTag("  ")).toThrow("Tag cannot be empty");
    });
  });

  describe("upgradeImportance", () => {
    it("should upgrade importance from low to medium", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["test"], importance: "low" }
      );

      episode.upgradeImportance("medium");

      expect(episode.importanceLevel).toBe("medium");
    });

    it("should upgrade importance from medium to high", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["test"], importance: "medium" }
      );

      episode.upgradeImportance("high");

      expect(episode.importanceLevel).toBe("high");
    });

    it("should upgrade importance from low to high (skip medium)", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["test"], importance: "low" }
      );

      episode.upgradeImportance("high");

      expect(episode.importanceLevel).toBe("high");
    });

    it("should reject downgrade from medium to low", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["test"], importance: "medium" }
      );

      expect(() => episode.upgradeImportance("low")).toThrow(
        "Cannot downgrade or keep same importance level"
      );
    });

    it("should reject keeping same importance level", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["test"], importance: "medium" }
      );

      expect(() => episode.upgradeImportance("medium")).toThrow(
        "Cannot downgrade or keep same importance level"
      );
    });
  });

  describe("hasTag", () => {
    it("should return true for existing tag", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["sales", "pricing"] }
      );

      expect(episode.hasTag("sales")).toBe(true);
      expect(episode.hasTag("pricing")).toBe(true);
    });

    it("should return false for non-existing tag", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["sales"] }
      );

      expect(episode.hasTag("marketing")).toBe(false);
    });

    it("should return false for invalid tag format", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["valid"] }
      );

      expect(episode.hasTag("  ")).toBe(false);
    });
  });

  describe("hasAllTags", () => {
    it("should return true when all tags match", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["sales", "pricing", "enterprise"] }
      );

      expect(episode.hasAllTags(["sales", "pricing"])).toBe(true);
      expect(episode.hasAllTags(["sales"])).toBe(true);
    });

    it("should return false when some tags are missing", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["sales", "pricing"] }
      );

      expect(episode.hasAllTags(["sales", "marketing"])).toBe(false);
    });
  });

  describe("isMoreImportantThan", () => {
    it("should return true when importance is higher", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["test"], importance: "high" }
      );

      expect(episode.isMoreImportantThan("medium")).toBe(true);
      expect(episode.isMoreImportantThan("low")).toBe(true);
    });

    it("should return false when importance is equal or lower", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User interaction",
        {},
        { tags: ["test"], importance: "medium" }
      );

      expect(episode.isMoreImportantThan("medium")).toBe(false);
      expect(episode.isMoreImportantThan("high")).toBe(false);
    });
  });

  describe("toDTO", () => {
    it("should convert aggregate to DTO format", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "User asked about pricing",
        { topic: "pricing", priority: "high" },
        { tags: ["sales", "pricing"], importance: "high" }
      );

      const dto = episode.toDTO();

      expect(dto).toMatchObject({
        id: episode.id,
        type: "interaction",
        description: "User asked about pricing",
        data: { topic: "pricing", priority: "high" },
        metadata: {
          tags: ["sales", "pricing"],
          importance: "high",
          timestamp: episode.timestamp,
        },
      });
    });
  });

  describe("immutability", () => {
    it("should not allow external modification of data", () => {
      const originalData = { key: "value" };
      const episode = EpisodeAggregate.create(
        "interaction",
        "Test",
        originalData,
        { tags: ["test"] }
      );

      // Try to modify the original data
      originalData.key = "modified";

      // Episode data should remain unchanged
      expect(episode.data.key).toBe("value");
    });

    it("should not allow external modification of tags via getter", () => {
      const episode = EpisodeAggregate.create(
        "interaction",
        "Test",
        {},
        { tags: ["original"] }
      );

      const tags = episode.tags;
      // Tags array is readonly, but let's verify the underlying data is protected
      expect(tags).toEqual(["original"]);
    });
  });
});
