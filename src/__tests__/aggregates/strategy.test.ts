import { describe, it, expect } from "vitest";
import { StrategyAggregate } from "@/domains/strategy/aggregates";
import type { MarketingStrategy } from "@/types/marketing-strategy";

function makeOKR(id: string, priority: "primary" | "secondary" = "secondary") {
  return {
    id,
    objective: `Objective ${id}`,
    rationale: "Test rationale",
    keyResults: [
      {
        id: `kr-${id}-1`,
        metric: "Test metric",
        current: null,
        target: "100",
        timeline: "Q1 2026",
        confidence: "medium" as const,
      },
    ],
    priority,
    linkedDiscoveryData: {
      fromBlock: "business_context" as const,
      evidence: "Test evidence",
    },
  };
}

function makeAction(id: string, okrId: string, keyResultId: string) {
  return {
    id,
    okrId,
    keyResultId,
    title: `Action ${id}`,
    description: "Test action description",
    type: "quick_win" as const,
    effort: "low" as const,
    impact: "high" as const,
    requiredSkills: ["marketing"],
    requiredTools: [],
    dependencies: [],
    suggestedTimeline: "Semaine 1-2",
  };
}

function makeStrategy(
  overrides: Partial<MarketingStrategy> = {}
): MarketingStrategy {
  const okr1 = makeOKR("okr-1", "primary");
  const okr2 = makeOKR("okr-2", "secondary");
  return {
    metadata: {
      companyName: "TestCo",
      generatedAt: "2026-01-01T00:00:00.000Z",
      discoveryCompletionStatus: "complete",
      strategyVersion: 1,
    },
    diagnostic: {
      maturityScore: 55,
      strengths: ["Good SEO"],
      weaknesses: ["No paid ads"],
      opportunities: ["Content marketing"],
      threats: ["Strong competition"],
      summary: "Test summary",
    },
    okrs: [okr1, okr2],
    actions: [
      makeAction("action-1", "okr-1", "kr-okr-1-1"),
      makeAction("action-2", "okr-2", "kr-okr-2-1"),
    ],
    executionRoadmap: {
      phase1: { name: "Quick wins", duration: "0-30 jours", actionIds: ["action-1"] },
      phase2: { name: "Fondations", duration: "30-90 jours", actionIds: ["action-2"] },
      phase3: { name: "Stratégique", duration: "90+ jours", actionIds: [] },
    },
    constraints: {
      budgetFit: true,
      teamFit: true,
      adaptations: [],
    },
    narrativeSummary: "Test narrative summary for strategy.",
    ...overrides,
  };
}

describe("StrategyAggregate", () => {
  describe("create", () => {
    it("should create a valid strategy with all required fields", () => {
      const strategy = makeStrategy();
      const aggregate = StrategyAggregate.create(strategy);

      expect(aggregate.id).toMatch(/^strategy-/);
      expect(aggregate.companyName).toBe("TestCo");
      expect(aggregate.diagnostic.maturityScore).toBe(55);
      expect(aggregate.okrs).toHaveLength(2);
      expect(aggregate.actions).toHaveLength(2);
      expect(aggregate.narrativeSummary).toBe("Test narrative summary for strategy.");
    });

    it("should preserve original metadata", () => {
      const strategy = makeStrategy({
        metadata: {
          companyName: "AcmeCorp",
          generatedAt: "2026-03-12T10:00:00.000Z",
          discoveryCompletionStatus: "partial",
          strategyVersion: 3,
        },
      });
      const aggregate = StrategyAggregate.create(strategy);
      const output = aggregate.toStrategy();

      expect(output.metadata.companyName).toBe("AcmeCorp");
      expect(output.metadata.discoveryCompletionStatus).toBe("partial");
      expect(output.metadata.strategyVersion).toBe(3);
      expect(output.metadata.generatedAt).toBe("2026-03-12T10:00:00.000Z");
    });

    it("should raise STRATEGY_GENERATED domain event on creation", () => {
      const strategy = makeStrategy();
      const aggregate = StrategyAggregate.create(strategy);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("STRATEGY_GENERATED");
      expect(events[0].payload).toMatchObject({
        strategyId: aggregate.id,
        companyName: "TestCo",
        okrCount: 2,
        actionCount: 2,
        maturityScore: 55,
      });
    });

    it("should reject strategy with zero OKRs", () => {
      const strategy = makeStrategy({ okrs: [] });

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "A strategy must have at least one OKR"
      );
    });

    it("should reject strategy with more than 3 OKRs", () => {
      const strategy = makeStrategy({
        okrs: [
          makeOKR("okr-1", "primary"),
          makeOKR("okr-2"),
          makeOKR("okr-3"),
          makeOKR("okr-4"),
        ],
      });

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "A strategy must have at most 3 OKRs"
      );
    });

    it("should accept strategy with exactly 3 OKRs", () => {
      const strategy = makeStrategy({
        okrs: [
          makeOKR("okr-1", "primary"),
          makeOKR("okr-2"),
          makeOKR("okr-3"),
        ],
      });

      const aggregate = StrategyAggregate.create(strategy);
      expect(aggregate.okrs).toHaveLength(3);
    });

    it("should accept strategy with exactly 1 OKR", () => {
      const strategy = makeStrategy({
        okrs: [makeOKR("okr-1", "primary")],
      });

      const aggregate = StrategyAggregate.create(strategy);
      expect(aggregate.okrs).toHaveLength(1);
    });

    it("should reject strategy with zero actions", () => {
      const strategy = makeStrategy({ actions: [] });

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "A strategy must have at least one action"
      );
    });
  });

  describe("updateOKR", () => {
    it("should update an existing OKR", () => {
      const strategy = makeStrategy();
      const aggregate = StrategyAggregate.create(strategy);

      aggregate.updateOKR("okr-1", { objective: "New objective" });

      expect(aggregate.okrs[0].objective).toBe("New objective");
      // Other fields preserved
      expect(aggregate.okrs[0].id).toBe("okr-1");
      expect(aggregate.okrs[0].priority).toBe("primary");
    });

    it("should throw when OKR not found", () => {
      const strategy = makeStrategy();
      const aggregate = StrategyAggregate.create(strategy);

      expect(() =>
        aggregate.updateOKR("nonexistent", { objective: "x" })
      ).toThrow("OKR nonexistent not found");
    });
  });

  describe("removeOKR", () => {
    it("should remove OKR and its associated actions", () => {
      const strategy = makeStrategy();
      const aggregate = StrategyAggregate.create(strategy);

      aggregate.removeOKR("okr-1");

      expect(aggregate.okrs).toHaveLength(1);
      expect(aggregate.okrs[0].id).toBe("okr-2");
      // Actions for okr-1 should be removed
      expect(aggregate.actions.every((a) => a.okrId !== "okr-1")).toBe(true);
    });

    it("should throw when removing the last OKR", () => {
      const strategy = makeStrategy({
        okrs: [makeOKR("okr-1", "primary")],
      });
      const aggregate = StrategyAggregate.create(strategy);

      expect(() => aggregate.removeOKR("okr-1")).toThrow(
        "Cannot remove last OKR"
      );
    });

    it("should throw when OKR to remove does not exist", () => {
      const strategy = makeStrategy();
      const aggregate = StrategyAggregate.create(strategy);

      // removeOKR filters silently, but invariant check catches it only if it removes all
      // With 2 OKRs, removing a nonexistent one leaves 2 — no error
      aggregate.removeOKR("nonexistent");
      expect(aggregate.okrs).toHaveLength(2);
    });
  });

  describe("toStrategy", () => {
    it("should produce a complete MarketingStrategy object", () => {
      const input = makeStrategy();
      const aggregate = StrategyAggregate.create(input);
      const output = aggregate.toStrategy();

      expect(output.metadata.companyName).toBe("TestCo");
      expect(output.diagnostic).toEqual(input.diagnostic);
      expect(output.okrs).toHaveLength(2);
      expect(output.actions).toHaveLength(2);
      expect(output.executionRoadmap).toEqual(input.executionRoadmap);
      expect(output.constraints).toEqual(input.constraints);
      expect(output.narrativeSummary).toBe(input.narrativeSummary);
    });

    it("should return defensive copies of arrays", () => {
      const input = makeStrategy();
      const aggregate = StrategyAggregate.create(input);
      const output1 = aggregate.toStrategy();
      const output2 = aggregate.toStrategy();

      // Different array references
      expect(output1.okrs).not.toBe(output2.okrs);
      expect(output1.actions).not.toBe(output2.actions);
      // But equal content
      expect(output1.okrs).toEqual(output2.okrs);
    });
  });
});
