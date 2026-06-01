import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { PrismaEpisodicMemoryRepository } from "@/data/memory/prisma-episodic-memory";
import { PrismaSemanticMemoryRepository } from "@/data/memory/prisma-semantic-memory";
import { PrismaWorkingMemoryRepository } from "@/data/memory/prisma-working-memory";
import { ConsolidationPipeline } from "@/domains/memory/services/consolidation-pipeline";
import { MemoryQueryService } from "@/domains/memory/services/memory-query-service";

// Real Postgres round-trips for the Memory context.
// Run with `npm run test:integration` (docker compose up + migrations applied).

const episodic = new PrismaEpisodicMemoryRepository();
const semantic = new PrismaSemanticMemoryRepository();
const working = new PrismaWorkingMemoryRepository();

beforeEach(async () => {
  await episodic.reset();
  await semantic.reset();
  await working.reset();
});

afterAll(async () => {
  await episodic.reset();
  await semantic.reset();
  await working.reset();
  await prisma.$disconnect();
});

describe("PrismaEpisodicMemoryRepository (integration)", () => {
  it("records episodes/feedback/task results and reads them back", async () => {
    const ep = await episodic.recordEpisode(
      "interaction",
      "User asked about pricing",
      { topic: "pricing" },
      { tags: ["sales", "pricing"], importance: "high" }
    );
    expect(ep.id).toMatch(/^ep-/);
    expect(ep.data).toEqual({ topic: "pricing" });

    await episodic.recordFeedback("user", "positive", "great!");
    await episodic.recordTaskResult({ taskId: "t1", description: "did it", outcome: "success", data: { ok: true } });

    expect(await episodic.getEpisodes()).toHaveLength(1);
    expect(await episodic.getFeedback()).toHaveLength(1);

    const ctx = await episodic.getEpisodicContext();
    expect(ctx.episodes).toHaveLength(1);
    expect(ctx.taskResults).toHaveLength(1);
    expect(ctx.episodes[0].metadata.tags).toEqual(["sales", "pricing"]);
  });

  it("accumulates emergent patterns by type+tags", async () => {
    await episodic.recordEpisode("interaction", "a", {}, { tags: ["x", "y"], importance: "low" });
    await episodic.recordEpisode("interaction", "b", {}, { tags: ["y", "x"], importance: "low" });

    const patterns = await episodic.getEmergentPatterns();
    expect(patterns).toHaveLength(1);
    expect(patterns[0].occurrences).toBe(2);
  });
});

describe("PrismaSemanticMemoryRepository (integration)", () => {
  it("adds facts and upserts preferences by (category, key)", async () => {
    await semantic.addClientFact("business", "SaaS B2B", "onboarding");
    expect(await semantic.getClientFacts()).toHaveLength(1);

    await semantic.addPreference("tone", "voice", "direct", "medium");
    await semantic.addPreference("tone", "voice", "chaleureux", "strong"); // same key → update
    const prefs = await semantic.getPreferences();
    expect(prefs).toHaveLength(1);
    expect(prefs[0].value).toBe("chaleureux");
    expect(prefs[0].confidence).toBe("strong");
  });

  it("stores validated patterns and learned rules", async () => {
    await semantic.addValidatedPattern("seo", "desc", "trigger", "outcome", "reco");
    await semantic.addLearnedRule("rule", "marketing", "do X", "strong");
    const ctx = await semantic.getSemanticContext();
    expect(ctx.validatedPatterns).toHaveLength(1);
    expect(ctx.learnedRules).toHaveLength(1);
  });
});

describe("PrismaWorkingMemoryRepository (integration)", () => {
  it("starts, mutates and clears the single active session", async () => {
    await working.startSession("task A", "objective A");
    await working.storeIntermediate("step1", { done: true });
    await working.setScratchpad("note", "hello");

    const ctx = await working.getWorkingContext();
    expect(ctx.session).not.toBeNull();
    expect(ctx.session!.task).toBe("task A");
    expect(ctx.session!.intermediateResults).toEqual({ step1: { done: true } });
    expect(ctx.session!.scratchpad).toEqual({ note: "hello" });

    const cleared = await working.clearSession();
    expect(cleared!.task).toBe("task A");
    expect((await working.getWorkingContext()).session).toBeNull();
  });
});

describe("Consolidation + Query (integration)", () => {
  it("promotes a recurring emergent pattern to a validated pattern", async () => {
    const pipeline = new ConsolidationPipeline(working, episodic, semantic);
    const queryService = new MemoryQueryService(working, episodic, semantic);

    // 3 episodes with the same type+tags → occurrences reaches the promotion threshold.
    for (let i = 0; i < 3; i++) {
      await episodic.recordEpisode("task_result", `run ${i}`, {}, { tags: ["repeat"], importance: "medium" });
    }

    await pipeline.runConsolidation();

    const validated = await semantic.getValidatedPatterns();
    expect(validated.length).toBeGreaterThanOrEqual(1);

    const stats = await queryService.getStats();
    expect(stats.semantic.patterns).toBeGreaterThanOrEqual(1);
  });
});
