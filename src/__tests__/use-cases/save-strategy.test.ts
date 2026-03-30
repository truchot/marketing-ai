import { describe, it, expect } from "vitest";
import { SaveStrategyUseCase } from "@/domains/strategy/use-cases/save-strategy";
import { FakeStrategyRepository } from "../fakes/fake-strategy-repository";
import { makeStrategy, makeOKR } from "../fixtures/strategy.fixture";

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
    const strategy = makeStrategy();
    strategy.strategic.okrs = [];

    const result = useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at least one OKR");
  });

  it("should reject strategy with more than 3 OKRs", () => {
    const { useCase } = setup();
    const strategy = makeStrategy();
    strategy.strategic.okrs = [
      makeOKR("okr-1", "primary"),
      makeOKR("okr-2"),
      makeOKR("okr-3"),
      makeOKR("okr-4"),
    ];

    const result = useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at most 3 OKRs");
  });

  it("should reject strategy with zero campaigns", () => {
    const { useCase } = setup();
    const strategy = makeStrategy();
    strategy.tactical.marketingPlan.campaigns = [];

    const result = useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at least one campaign");
  });

  it("should reject strategy with zero operational tasks", () => {
    const { useCase } = setup();
    const strategy = makeStrategy();
    strategy.operational.tasks = [];

    const result = useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at least one operational task");
  });

  it("should save multiple strategies and retrieve latest", () => {
    const { repo, useCase } = setup();

    useCase.execute(makeStrategy({ metadata: { companyName: "First", generatedAt: "2026-01-01T00:00:00.000Z", discoveryCompletionStatus: "complete", strategyVersion: 1 } }));
    useCase.execute(makeStrategy({ metadata: { companyName: "Second", generatedAt: "2026-02-01T00:00:00.000Z", discoveryCompletionStatus: "complete", strategyVersion: 1 } }));

    expect(repo.getLatest()!.metadata.companyName).toBe("Second");
  });
});
