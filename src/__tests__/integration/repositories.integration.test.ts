import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { PrismaStrategyRepository } from "@/data/strategy-repository";
import { PrismaConversationRepository } from "@/data/conversation-repository";
import { PrismaCompanyProfileRepository } from "@/data/company-profile-repository";
import { PrismaBusinessDiscoveryRepository } from "@/data/business-discovery-repository";
import { SaveStrategyUseCase } from "@/domains/strategy/use-cases/save-strategy";
import type { MarketingStrategy } from "@/types/marketing-strategy";
import type { BusinessDiscovery } from "@/types/business-discovery";

// Real Postgres round-trips for the migrated contexts.
// Run with `npm run test:integration` (docker compose up + migrations applied).

const strategyRepo = new PrismaStrategyRepository();
const conversationRepo = new PrismaConversationRepository();
const profileRepo = new PrismaCompanyProfileRepository();
const discoveryRepo = new PrismaBusinessDiscoveryRepository();

function makeStrategy(overrides: Partial<MarketingStrategy> = {}): MarketingStrategy {
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
        linkedDiscoveryData: { fromBlock: "business_context", evidence: "low visibility" },
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
        channel: "seo",
      },
    ],
    executionRoadmap: {
      phase1: { name: "Quick wins", duration: "0-30 jours", actionIds: ["action-1"] },
      phase2: { name: "Fondations", duration: "30-90 jours", actionIds: [] },
      phase3: { name: "Stratégique", duration: "90+ jours", actionIds: [] },
    },
    constraints: { budgetFit: true, teamFit: true, adaptations: [] },
    narrativeSummary: "Test narrative.",
    ...overrides,
  };
}

beforeEach(async () => {
  await strategyRepo.reset();
  await conversationRepo.reset();
  await profileRepo.reset();
  await discoveryRepo.reset();
});

afterAll(async () => {
  await strategyRepo.reset();
  await conversationRepo.reset();
  await profileRepo.reset();
  await discoveryRepo.reset();
  await prisma.$disconnect();
});

describe("PrismaStrategyRepository (integration)", () => {
  it("round-trips a nested strategy (okrs, key results, actions, roadmap, diagnostic)", async () => {
    const uc = new SaveStrategyUseCase(strategyRepo);
    const result = await uc.execute(makeStrategy());
    expect(result.isOk()).toBe(true);

    const latest = (await strategyRepo.getLatest())!;
    expect(latest.metadata.companyName).toBe("TestCo");
    expect(latest.okrs).toHaveLength(1);
    expect(latest.okrs[0].id).toBe("okr-1");
    expect(latest.okrs[0].keyResults).toHaveLength(1);
    expect(latest.okrs[0].keyResults[0].target).toBe("5000");
    expect(latest.actions).toHaveLength(1);
    expect(latest.actions[0].channel).toBe("seo");
    expect(latest.executionRoadmap.phase1.actionIds).toEqual(["action-1"]);
    expect(latest.diagnostic.strengths).toEqual(["Good SEO"]);

    const byId = await strategyRepo.get(result.value);
    expect(byId!.metadata.companyName).toBe("TestCo");
  });

  it("getLatest returns the most recently saved strategy", async () => {
    const uc = new SaveStrategyUseCase(strategyRepo);
    await uc.execute(makeStrategy({ metadata: { companyName: "First", generatedAt: "2026-01-01T00:00:00.000Z", discoveryCompletionStatus: "complete", strategyVersion: 1 } }));
    await uc.execute(makeStrategy({ metadata: { companyName: "Second", generatedAt: "2026-02-01T00:00:00.000Z", discoveryCompletionStatus: "complete", strategyVersion: 1 } }));
    expect((await strategyRepo.getLatest())!.metadata.companyName).toBe("Second");
  });
});

describe("PrismaConversationRepository (integration)", () => {
  it("persists messages in insertion order and supports bulk", async () => {
    const a = await conversationRepo.add("user", "hi");
    const b = await conversationRepo.add("assistant", "hello");
    expect(a.role).toBe("user");
    expect(b.role).toBe("assistant");

    let all = await conversationRepo.getAll();
    expect(all.map((m) => m.content)).toEqual(["hi", "hello"]);

    await conversationRepo.addBulk([
      { role: "user", content: "x" },
      { role: "assistant", content: "y" },
    ]);
    all = await conversationRepo.getAll();
    expect(all).toHaveLength(4);
    expect(all.map((m) => m.content)).toEqual(["hi", "hello", "x", "y"]);
  });
});

describe("PrismaCompanyProfileRepository (integration)", () => {
  it("creates then updates the single current profile", async () => {
    expect(await profileRepo.get()).toBeNull();

    const created = await profileRepo.save({
      name: "Acme",
      sector: "SaaS",
      description: "Cloud platform for teams",
      target: "PMs",
      brandTone: "pro",
    });
    expect(created.id).toBeDefined();

    const updated = await profileRepo.save({
      name: "Acme v2",
      sector: "SaaS B2B",
      description: "Cloud platform for product teams",
      target: "PMs and PMMs",
      brandTone: "pro",
      discoveryId: "disc-1",
    });

    const got = (await profileRepo.get())!;
    expect(got.id).toBe(created.id); // same row updated
    expect(got.name).toBe("Acme v2");
    expect(got.discoveryId).toBe("disc-1");
    expect(updated.id).toBe(created.id);
  });
});

describe("PrismaBusinessDiscoveryRepository (integration)", () => {
  it("round-trips the discovery document via JSONB", async () => {
    const discovery = {
      metadata: { companyName: "Kompta", sector: "saas" },
      problem: { statement: "erreurs fiscales" },
      audiences: [{ segment: "freelances", priority: "primary" }],
    } as unknown as BusinessDiscovery;

    const id = await discoveryRepo.save(discovery);
    const got = (await discoveryRepo.get(id))!;
    expect(got.metadata.companyName).toBe("Kompta");
    expect((got as unknown as { problem: { statement: string } }).problem.statement).toBe(
      "erreurs fiscales"
    );

    const latest = (await discoveryRepo.getLatest())!;
    expect(latest.metadata.companyName).toBe("Kompta");
  });
});
