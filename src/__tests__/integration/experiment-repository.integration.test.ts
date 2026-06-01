import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaExperimentRepository } from "@/data/experiment-repository";
import { prisma } from "@/lib/prisma";
import {
  GenerateBacklogUseCase,
  PlanWeekUseCase,
  ProduceAssetUseCase,
  DailyPlanProjection,
} from "@/domains/experimentation";
import type { CreateExperimentInput } from "@/domains/experimentation";

// Real Postgres round-trip (docker compose up + migrations applied).
// Excluded from the default suite — run with `npm run test:integration`.

const repo = new PrismaExperimentRepository();
const generate = new GenerateBacklogUseCase(repo);
const planWeek = new PlanWeekUseCase(repo);
const produce = new ProduceAssetUseCase(repo);
const projection = new DailyPlanProjection(repo);

function rawInput(overrides: Partial<CreateExperimentInput> = {}): CreateExperimentInput {
  return {
    keyResultId: "kr-itest",
    okrId: "okr-itest",
    actionId: "action-itest",
    title: "Experiment integration",
    hypothesis: {
      belief: "poster une série",
      audience: "freelances",
      outcome: "des essais",
      successMetric: "CTR",
      threshold: "> 2%",
    },
    channel: "linkedin",
    audienceSegment: "freelances",
    ice: { impact: 8, confidence: 7, ease: 9 },
    confidenceSources: [
      { type: "competitor_intel", evidence: "angle X chez 2/3 concurrents" },
      { type: "sector_benchmark", evidence: "SaaS B2B" },
    ],
    companyName: "Kompta",
    ...overrides,
  };
}

beforeEach(async () => {
  await repo.reset();
});

afterAll(async () => {
  await repo.reset();
  await prisma.$disconnect();
});

describe("PrismaExperimentRepository (integration)", () => {
  it("round-trips an experiment with hypothesis, ICE and confidence sources", async () => {
    const created = (await generate.execute([{ kind: "raw", input: rawInput() }])).value[0];

    const fetched = (await repo.get(created.id))!;
    expect(fetched).not.toBeNull();
    expect(fetched.keyResultId).toBe("kr-itest");
    expect(fetched.hypothesis.threshold).toBe("> 2%");
    expect(fetched.ice).toEqual({ impact: 8, confidence: 7, ease: 9 });
    expect(fetched.confidenceSources).toHaveLength(2);
    expect(fetched.status).toBe("draft");
  });

  it("persists the weekly daily actions and exposes them via DailyPlan", async () => {
    const id = (await generate.execute([{ kind: "raw", input: rawInput() }])).value[0].id;
    await planWeek.execute({
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

    const reloaded = (await repo.get(id))!;
    expect(reloaded.status).toBe("selected");
    expect(reloaded.weekOf).toBe("2026-06-01");
    expect(reloaded.dailyActions).toHaveLength(2);

    const today = await projection.forDate("2026-06-01");
    expect(today).toHaveLength(1);
    expect(today[0].keyResultId).toBe("kr-itest");
    expect(today[0].hasAsset).toBe(false);

    expect(await projection.forWeek("2026-06-01")).toHaveLength(2);
  });

  it("persists a produced asset across reloads", async () => {
    const id = (await generate.execute([{ kind: "raw", input: rawInput() }])).value[0].id;
    const planned = await planWeek.execute({
      weekOf: "2026-06-01",
      capacityPerWeek: 5,
      items: [{ experimentId: id, dailyAtoms: [{ scheduledDate: "2026-06-01", title: "Post" }] }],
    });
    const dailyId = planned.value[0].dailyActions[0].id;

    await produce.execute({
      experimentId: id,
      dailyActionId: dailyId,
      asset: { format: "linkedin_post", variantLabel: "hook A", content: "Hook A…" },
    });

    const daily = (await repo.get(id))!.dailyActions.find((d) => d.id === dailyId)!;
    expect(daily.asset?.content).toBe("Hook A…");
    expect(daily.asset?.variantLabel).toBe("hook A");
  });

  it("indexes by KeyResult and week", async () => {
    await generate.execute([
      { kind: "raw", input: rawInput({ keyResultId: "kr-A" }) },
      { kind: "raw", input: rawInput({ keyResultId: "kr-B" }) },
    ]);
    expect(await repo.listByKeyResult("kr-A")).toHaveLength(1);
    expect(await repo.list()).toHaveLength(2);
  });
});
