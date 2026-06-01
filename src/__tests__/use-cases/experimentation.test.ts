import { describe, it, expect, beforeEach } from "vitest";
import {
  GenerateBacklogUseCase,
  PlanWeekUseCase,
  ProduceAssetUseCase,
  DailyPlanProjection,
} from "@/domains/experimentation";
import type { CreateExperimentInput } from "@/domains/experimentation";
import type { Hypothesis } from "@/types/experiment";
import type { Action } from "@/types/marketing-strategy";
import { FakeExperimentRepository } from "../fakes";

// --- Builders ---

function makeHypothesis(overrides: Partial<Hypothesis> = {}): Hypothesis {
  return {
    belief: "poster une série",
    audience: "freelances",
    outcome: "des essais",
    successMetric: "CTR",
    threshold: "> 2%",
    ...overrides,
  };
}

function makeRawInput(overrides: Partial<CreateExperimentInput> = {}): CreateExperimentInput {
  return {
    keyResultId: "kr-1",
    okrId: "okr-1",
    title: "Experiment",
    hypothesis: makeHypothesis(),
    channel: "linkedin",
    ice: { impact: 8, confidence: 8, ease: 8 },
    companyName: "Kompta",
    ...overrides,
  };
}

function makeAction(overrides: Partial<Action> = {}): Action {
  return {
    id: "action-1",
    okrId: "okr-1",
    keyResultId: "kr-1",
    title: "Créer une page SEO",
    description: "desc",
    type: "quick_win",
    effort: "low",
    impact: "high",
    requiredSkills: [],
    requiredTools: [],
    dependencies: [],
    suggestedTimeline: "S1",
    channel: "seo",
    ...overrides,
  };
}

describe("GenerateBacklogUseCase", () => {
  let repo: FakeExperimentRepository;
  let usecase: GenerateBacklogUseCase;

  beforeEach(() => {
    repo = new FakeExperimentRepository();
    usecase = new GenerateBacklogUseCase(repo);
  });

  it("creates, persists and ranks experiments by ICE priority (desc)", async () => {
    const result = await usecase.execute([
      { kind: "raw", input: makeRawInput({ title: "Low", ice: { impact: 5, confidence: 5, ease: 5 } }) },
      { kind: "raw", input: makeRawInput({ title: "High", ice: { impact: 9, confidence: 9, ease: 9 } }) },
    ]);

    expect(result.isOk()).toBe(true);
    const backlog = result.value;
    expect(backlog.map((e) => e.title)).toEqual(["High", "Low"]); // ranked desc
    expect(backlog.every((e) => e.status === "draft")).toBe(true);
    expect(await repo.list()).toHaveLength(2);
  });

  it("promotes an Action into an experiment, seeding ICE from the Action levels", async () => {
    const result = await usecase.execute([
      {
        kind: "fromAction",
        action: makeAction({ impact: "high", effort: "low" }),
        hypothesis: makeHypothesis(),
        confidence: 6,
        companyName: "Kompta",
      },
    ]);

    expect(result.isOk()).toBe(true);
    const exp = result.value[0];
    expect(exp.ice).toEqual({ impact: 9, confidence: 6, ease: 9 });
    expect(exp.actionId).toBe("action-1");
    expect(exp.keyResultId).toBe("kr-1");
  });

  it("fails on an empty candidate list", async () => {
    const result = await usecase.execute([]);
    expect(result.isErr()).toBe(true);
    expect(result.error.message).toMatch(/at least one candidate/);
  });

  it("fails (and persists nothing) when a candidate violates an invariant", async () => {
    const result = await usecase.execute([
      { kind: "raw", input: makeRawInput({ hypothesis: makeHypothesis({ threshold: "" }) }) },
    ]);
    expect(result.isErr()).toBe(true);
    expect(result.error.message).toMatch(/falsifiable/);
    expect(await repo.list()).toHaveLength(0);
  });

  it("indexes persisted experiments by KeyResult", async () => {
    await usecase.execute([
      { kind: "raw", input: makeRawInput({ keyResultId: "kr-A" }) },
      { kind: "raw", input: makeRawInput({ keyResultId: "kr-B" }) },
    ]);
    expect(await repo.listByKeyResult("kr-A")).toHaveLength(1);
  });
});

describe("PlanWeekUseCase", () => {
  let repo: FakeExperimentRepository;
  let generate: GenerateBacklogUseCase;
  let planWeek: PlanWeekUseCase;

  beforeEach(() => {
    repo = new FakeExperimentRepository();
    generate = new GenerateBacklogUseCase(repo);
    planWeek = new PlanWeekUseCase(repo);
  });

  async function seedDraft(title: string): Promise<string> {
    const r = await generate.execute([{ kind: "raw", input: makeRawInput({ title }) }]);
    return r.value[0].id;
  }

  it("selects experiments for the week and declines them into daily actions", async () => {
    const id = await seedDraft("EXP");
    const result = await planWeek.execute({
      weekOf: "2026-06-01",
      capacityPerWeek: 5,
      items: [
        {
          experimentId: id,
          dailyAtoms: [
            { scheduledDate: "2026-06-01", title: "Post #1" },
            { scheduledDate: "2026-06-03", title: "Post #2" },
          ],
        },
      ],
    });

    expect(result.isOk()).toBe(true);
    const exp = (await repo.get(id))!;
    expect(exp.status).toBe("selected");
    expect(exp.weekOf).toBe("2026-06-01");
    expect(exp.dailyActions).toHaveLength(2);
    expect(exp.dailyActions.every((d) => d.status === "proposed")).toBe(true);
  });

  it("fails when the planned atoms exceed the weekly capacity (nothing persisted)", async () => {
    const id = await seedDraft("EXP");
    const result = await planWeek.execute({
      weekOf: "2026-06-01",
      capacityPerWeek: 1,
      items: [
        {
          experimentId: id,
          dailyAtoms: [
            { scheduledDate: "2026-06-01", title: "A" },
            { scheduledDate: "2026-06-02", title: "B" },
          ],
        },
      ],
    });

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toMatch(/capacity exceeded/);
    expect((await repo.get(id))!.status).toBe("draft");
    expect((await repo.get(id))!.dailyActions).toHaveLength(0);
  });

  it("fails when an experiment is not found", async () => {
    const result = await planWeek.execute({
      weekOf: "2026-06-01",
      capacityPerWeek: 5,
      items: [{ experimentId: "exp-unknown", dailyAtoms: [{ scheduledDate: "2026-06-01", title: "A" }] }],
    });
    expect(result.isErr()).toBe(true);
    expect(result.error.message).toMatch(/not found/);
  });

  it("is all-or-nothing: a partial failure persists no changes", async () => {
    const e1 = await seedDraft("E1");
    const e2 = await seedDraft("E2");
    // Select e1 first so it is no longer a draft.
    await planWeek.execute({
      weekOf: "2026-06-01",
      capacityPerWeek: 5,
      items: [{ experimentId: e1, dailyAtoms: [{ scheduledDate: "2026-06-01", title: "A" }] }],
    });

    // Now plan [e1, e2] together — e1 will throw (already selected).
    const result = await planWeek.execute({
      weekOf: "2026-06-08",
      capacityPerWeek: 5,
      items: [
        { experimentId: e1, dailyAtoms: [{ scheduledDate: "2026-06-08", title: "X" }] },
        { experimentId: e2, dailyAtoms: [{ scheduledDate: "2026-06-08", title: "Y" }] },
      ],
    });

    expect(result.isErr()).toBe(true);
    // e2 must remain an untouched draft (no partial persist).
    expect((await repo.get(e2))!.status).toBe("draft");
    expect((await repo.get(e2))!.dailyActions).toHaveLength(0);
  });
});

describe("ProduceAssetUseCase", () => {
  let repo: FakeExperimentRepository;
  let generate: GenerateBacklogUseCase;
  let planWeek: PlanWeekUseCase;
  let produce: ProduceAssetUseCase;

  beforeEach(() => {
    repo = new FakeExperimentRepository();
    generate = new GenerateBacklogUseCase(repo);
    planWeek = new PlanWeekUseCase(repo);
    produce = new ProduceAssetUseCase(repo);
  });

  async function seedWithDaily(): Promise<{ experimentId: string; dailyActionId: string }> {
    const gen = await generate.execute([{ kind: "raw", input: makeRawInput() }]);
    const experimentId = gen.value[0].id;
    const planned = await planWeek.execute({
      weekOf: "2026-06-01",
      capacityPerWeek: 5,
      items: [{ experimentId, dailyAtoms: [{ scheduledDate: "2026-06-01", title: "Post" }] }],
    });
    return { experimentId, dailyActionId: planned.value[0].dailyActions[0].id };
  }

  it("attaches a produced asset and persists it", async () => {
    const { experimentId, dailyActionId } = await seedWithDaily();
    const result = await produce.execute({
      experimentId,
      dailyActionId,
      asset: { format: "linkedin_post", variantLabel: "hook A", content: "Hook A…" },
    });

    expect(result.isOk()).toBe(true);
    const daily = (await repo.get(experimentId))!.dailyActions.find((d) => d.id === dailyActionId)!;
    expect(daily.asset?.content).toBe("Hook A…");
  });

  it("fails when the experiment is not found", async () => {
    const result = await produce.execute({
      experimentId: "exp-unknown",
      dailyActionId: "daily-x",
      asset: { format: "linkedin_post", content: "x" },
    });
    expect(result.isErr()).toBe(true);
    expect(result.error.message).toMatch(/not found/);
  });

  it("fails when the daily action is unknown", async () => {
    const { experimentId } = await seedWithDaily();
    const result = await produce.execute({
      experimentId,
      dailyActionId: "daily-unknown",
      asset: { format: "linkedin_post", content: "x" },
    });
    expect(result.isErr()).toBe(true);
    expect(result.error.message).toMatch(/not found/);
  });
});

describe("DailyPlanProjection", () => {
  let repo: FakeExperimentRepository;
  let generate: GenerateBacklogUseCase;
  let planWeek: PlanWeekUseCase;
  let produce: ProduceAssetUseCase;
  let projection: DailyPlanProjection;

  beforeEach(() => {
    repo = new FakeExperimentRepository();
    generate = new GenerateBacklogUseCase(repo);
    planWeek = new PlanWeekUseCase(repo);
    produce = new ProduceAssetUseCase(repo);
    projection = new DailyPlanProjection(repo);
  });

  async function plan(
    title: string,
    ice: { impact: number; confidence: number; ease: number },
    date: string
  ): Promise<string> {
    const gen = await generate.execute([{ kind: "raw", input: makeRawInput({ title, ice }) }]);
    const id = gen.value[0].id;
    await planWeek.execute({
      weekOf: "2026-06-01",
      capacityPerWeek: 5,
      items: [{ experimentId: id, dailyAtoms: [{ scheduledDate: date, title: `${title} atom` }] }],
    });
    return id;
  }

  it("forDate returns the day's atoms across experiments, ranked by priority", async () => {
    await plan("Low", { impact: 4, confidence: 4, ease: 4 }, "2026-06-01");
    await plan("High", { impact: 9, confidence: 9, ease: 9 }, "2026-06-01");
    await plan("Other", { impact: 9, confidence: 9, ease: 9 }, "2026-06-02");

    const today = await projection.forDate("2026-06-01");
    expect(today).toHaveLength(2);
    expect(today.map((e) => e.experimentTitle)).toEqual(["High", "Low"]);
    // Causal trail is present.
    expect(today[0].keyResultId).toBe("kr-1");
    expect(today[0].priorityScore).toBe(9);
  });

  it("forWeek returns all atoms of the week's experiments", async () => {
    await plan("A", { impact: 6, confidence: 6, ease: 6 }, "2026-06-01");
    await plan("B", { impact: 6, confidence: 6, ease: 6 }, "2026-06-03");

    expect(await projection.forWeek("2026-06-01")).toHaveLength(2);
    expect(await projection.forWeek("2026-06-08")).toHaveLength(0);
  });

  it("reflects produced assets via hasAsset", async () => {
    const id = await plan("A", { impact: 6, confidence: 6, ease: 6 }, "2026-06-01");
    const dailyId = (await repo.get(id))!.dailyActions[0].id;

    expect((await projection.forDate("2026-06-01"))[0].hasAsset).toBe(false);

    await produce.execute({ experimentId: id, dailyActionId: dailyId, asset: { format: "linkedin_post", content: "x" } });
    expect((await projection.forDate("2026-06-01"))[0].hasAsset).toBe(true);
  });
});
