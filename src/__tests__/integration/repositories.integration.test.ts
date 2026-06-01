import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { PrismaStrategyRepository } from "@/data/strategy-repository";
import { PrismaConversationRepository } from "@/data/conversation-repository";
import { PrismaCompanyProfileRepository } from "@/data/company-profile-repository";
import { PrismaBusinessDiscoveryRepository } from "@/data/business-discovery-repository";
import { SaveStrategyUseCase } from "@/domains/strategy/use-cases/save-strategy";
import { CompanyProfileAggregate } from "@/domains/client-knowledge/aggregates";
import { makeStrategy } from "../fixtures/strategy.fixture";
import type { BusinessDiscovery } from "@/types/business-discovery";

// Real Postgres round-trips for the migrated contexts.
// Run with `npm run test:integration` (docker compose up + migrations applied).

const strategyRepo = new PrismaStrategyRepository();
const conversationRepo = new PrismaConversationRepository();
const profileRepo = new PrismaCompanyProfileRepository();
const discoveryRepo = new PrismaBusinessDiscoveryRepository();

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
  it("round-trips a 3-level strategy via JSONB and reconstitutes the aggregate", async () => {
    const uc = new SaveStrategyUseCase(strategyRepo);
    const result = await uc.execute(makeStrategy());
    expect(result.isOk()).toBe(true);

    const latest = (await strategyRepo.getLatest())!;
    expect(latest.metadata.companyName).toBe("TestCo");
    expect(latest.okrs.length).toBeGreaterThanOrEqual(1);
    expect(latest.marketingPlan.campaigns.length).toBeGreaterThanOrEqual(1);
    expect(latest.operational.tasks.length).toBeGreaterThanOrEqual(1);

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
  it("creates then upserts the profile by id", async () => {
    expect(await profileRepo.get()).toBeNull();

    const p1 = CompanyProfileAggregate.create({
      name: "Acme",
      sector: "SaaS",
      description: "Cloud platform for teams",
      target: "PMs",
      brandTone: "pro",
    }).toDTO();
    const created = await profileRepo.save(p1);
    expect(created.id).toBe(p1.id);

    const p2 = { ...p1, name: "Acme v2", sector: "SaaS B2B", discoveryId: "disc-1", updatedAt: "2026-01-02T00:00:00.000Z" };
    await profileRepo.save(p2);

    const got = (await profileRepo.get())!;
    expect(got.id).toBe(p1.id); // same row updated
    expect(got.name).toBe("Acme v2");
    expect(got.discoveryId).toBe("disc-1");
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
