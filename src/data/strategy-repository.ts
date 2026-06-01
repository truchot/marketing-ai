// ============================================================
// PrismaStrategyRepository
// The 3-level MarketingStrategy is document-shaped → stored as JSONB.
// Returns a reconstituted StrategyAggregate.
// ============================================================

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { IStrategyRepository } from "@/domains/strategy/ports";
import type { MarketingStrategy } from "@/types/marketing-strategy";
import { StrategyAggregate } from "@/domains/strategy/aggregates";

export class PrismaStrategyRepository implements IStrategyRepository {
  async save(id: string, strategy: MarketingStrategy): Promise<void> {
    const data = strategy as unknown as Prisma.InputJsonValue;
    await prisma.strategy.upsert({
      where: { id },
      create: { id, companyName: strategy.metadata.companyName, data },
      update: { companyName: strategy.metadata.companyName, data },
    });
  }

  async get(strategyId: string): Promise<StrategyAggregate | null> {
    const row = await prisma.strategy.findUnique({ where: { id: strategyId } });
    return row
      ? StrategyAggregate.fromPersisted(row.id, row.data as unknown as MarketingStrategy)
      : null;
  }

  async getLatest(): Promise<StrategyAggregate | null> {
    const row = await prisma.strategy.findFirst({ orderBy: { seq: "desc" } });
    return row
      ? StrategyAggregate.fromPersisted(row.id, row.data as unknown as MarketingStrategy)
      : null;
  }

  async reset(): Promise<void> {
    await prisma.strategy.deleteMany({});
  }
}

export const strategyRepository = new PrismaStrategyRepository();
