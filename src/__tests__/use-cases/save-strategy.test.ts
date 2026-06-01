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

  it("should save a valid strategy and return an id", async () => {
    const { repo, useCase } = setup();
    const strategy = makeStrategy();

    const result = await useCase.execute(strategy);

    expect(result.isOk()).toBe(true);
    expect(result.value).toMatch(/^strategy-/);
    expect(await repo.getLatest()).not.toBeNull();
    expect((await repo.getLatest())!.metadata.companyName).toBe("TestCo");
  });

  it("should preserve metadata through save round-trip", async () => {
    const { repo, useCase } = setup();
    const strategy = makeStrategy({
      metadata: {
        companyName: "AcmeCorp",
        generatedAt: "2026-03-12T10:00:00.000Z",
        discoveryCompletionStatus: "partial",
        strategyVersion: 2,
      },
    });

    await useCase.execute(strategy);
    const saved = (await repo.getLatest())!;

    expect(saved.metadata.discoveryCompletionStatus).toBe("partial");
    expect(saved.metadata.strategyVersion).toBe(2);
  });

  it("should reject strategy with zero OKRs", async () => {
    const { useCase } = setup();
    const strategy = makeStrategy();
    strategy.strategic.okrs = [];

    const result = await useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at least one OKR");
  });

  it("should reject strategy with more than 3 OKRs", async () => {
    const { useCase } = setup();
    const strategy = makeStrategy();
    strategy.strategic.okrs = [
      makeOKR("okr-1", "primary"),
      makeOKR("okr-2"),
      makeOKR("okr-3"),
      makeOKR("okr-4"),
    ];

    const result = await useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at most 3 OKRs");
  });

  it("should reject strategy with zero campaigns", async () => {
    const { useCase } = setup();
    const strategy = makeStrategy();
    strategy.tactical.marketingPlan.campaigns = [];

    const result = await useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at least one campaign");
  });

  it("should reject strategy with zero operational tasks", async () => {
    const { useCase } = setup();
    const strategy = makeStrategy();
    strategy.operational.tasks = [];

    const result = await useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at least one operational task");
  });

  it("should save multiple strategies and retrieve latest", async () => {
    const { repo, useCase } = setup();

    await useCase.execute(makeStrategy({ metadata: { companyName: "First", generatedAt: "2026-01-01T00:00:00.000Z", discoveryCompletionStatus: "complete", strategyVersion: 1 } }));
    await useCase.execute(makeStrategy({ metadata: { companyName: "Second", generatedAt: "2026-02-01T00:00:00.000Z", discoveryCompletionStatus: "complete", strategyVersion: 1 } }));

    expect((await repo.getLatest())!.metadata.companyName).toBe("Second");
  });
});
