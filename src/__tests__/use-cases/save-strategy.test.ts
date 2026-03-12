import { describe, it, expect } from "vitest";
import { SaveStrategyUseCase } from "@/domains/strategy/use-cases/save-strategy";
import { FakeStrategyRepository } from "../fakes/fake-strategy-repository";
import type { MarketingStrategy } from "@/types/marketing-strategy";

function makeStrategy(
  overrides: Partial<MarketingStrategy> = {}
): MarketingStrategy {
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
    okrs: [
      {
        id: "okr-1",
        objective: "Increase visibility",
        rationale: "Low brand awareness",
        keyResults: [
          {
            id: "kr-1-1",
            metric: "Monthly organic traffic",
            current: "1000",
            target: "5000",
            timeline: "Q2 2026",
            confidence: "medium",
          },
        ],
        priority: "primary",
        linkedDiscoveryData: {
          fromBlock: "business_context",
          evidence: "Client mentioned low visibility",
        },
      },
    ],
    actions: [
      {
        id: "action-1",
        okrId: "okr-1",
        keyResultId: "kr-1-1",
        title: "SEO audit",
        description: "Perform a full SEO audit",
        type: "quick_win",
        effort: "low",
        impact: "high",
        requiredSkills: ["SEO"],
        requiredTools: ["Ahrefs"],
        dependencies: [],
        suggestedTimeline: "Semaine 1",
      },
    ],
    executionRoadmap: {
      phase1: { name: "Quick wins", duration: "0-30 jours", actionIds: ["action-1"] },
      phase2: { name: "Fondations", duration: "30-90 jours", actionIds: [] },
      phase3: { name: "Stratégique", duration: "90+ jours", actionIds: [] },
    },
    constraints: {
      budgetFit: true,
      teamFit: true,
      adaptations: [],
    },
    narrativeSummary: "Test narrative.",
    ...overrides,
  };
}

describe("SaveStrategyUseCase", () => {
  function setup() {
    const repo = new FakeStrategyRepository();
    const useCase = new SaveStrategyUseCase(repo);
    return { repo, useCase };
  }

  it("should save a valid strategy and return an id", () => {
    const { repo, useCase } = setup();
    const strategy = makeStrategy();

    const result = useCase.execute(strategy);

    expect(result.isOk()).toBe(true);
    expect(result.value).toMatch(/^strategy-test-/);
    expect(repo.getLatest()).not.toBeNull();
    expect(repo.getLatest()!.metadata.companyName).toBe("TestCo");
  });

  it("should preserve metadata through save round-trip", () => {
    const { repo, useCase } = setup();
    const strategy = makeStrategy({
      metadata: {
        companyName: "AcmeCorp",
        generatedAt: "2026-03-12T10:00:00.000Z",
        discoveryCompletionStatus: "partial",
        strategyVersion: 2,
      },
    });

    useCase.execute(strategy);
    const saved = repo.getLatest()!;

    expect(saved.metadata.discoveryCompletionStatus).toBe("partial");
    expect(saved.metadata.strategyVersion).toBe(2);
  });

  it("should reject strategy with zero OKRs", () => {
    const { useCase } = setup();
    const strategy = makeStrategy({ okrs: [] });

    const result = useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at least one OKR");
  });

  it("should reject strategy with more than 3 OKRs", () => {
    const { useCase } = setup();
    const okr = {
      id: "okr-x",
      objective: "X",
      rationale: "X",
      keyResults: [
        { id: "kr-x", metric: "X", current: null, target: "X", timeline: "X", confidence: "low" as const },
      ],
      priority: "secondary" as const,
      linkedDiscoveryData: { fromBlock: "business_context" as const, evidence: "X" },
    };
    const strategy = makeStrategy({
      okrs: [
        { ...okr, id: "okr-1", priority: "primary" },
        { ...okr, id: "okr-2" },
        { ...okr, id: "okr-3" },
        { ...okr, id: "okr-4" },
      ],
    });

    const result = useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at most 3 OKRs");
  });

  it("should reject strategy with zero actions", () => {
    const { useCase } = setup();
    const strategy = makeStrategy({ actions: [] });

    const result = useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at least one action");
  });

  it("should save multiple strategies and retrieve latest", () => {
    const { repo, useCase } = setup();

    useCase.execute(makeStrategy({ metadata: { companyName: "First", generatedAt: "2026-01-01T00:00:00.000Z", discoveryCompletionStatus: "complete", strategyVersion: 1 } }));
    useCase.execute(makeStrategy({ metadata: { companyName: "Second", generatedAt: "2026-02-01T00:00:00.000Z", discoveryCompletionStatus: "complete", strategyVersion: 1 } }));

    expect(repo.getLatest()!.metadata.companyName).toBe("Second");
  });
});
