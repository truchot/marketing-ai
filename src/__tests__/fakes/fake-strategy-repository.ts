import type { IStrategyRepository } from "@/domains/strategy/ports";
import type { MarketingStrategy } from "@/types/marketing-strategy";
import { StrategyAggregate } from "@/domains/strategy/aggregates";

/**
 * Standalone in-memory strategy repository for tests.
 * Each instance has its own isolated state (no shared globals).
 */
export class FakeStrategyRepository implements IStrategyRepository {
  private store = new Map<string, MarketingStrategy>();
  private latestId: string | null = null;

  async save(id: string, strategy: MarketingStrategy): Promise<void> {
    this.store.set(id, strategy);
    this.latestId = id;
  }

  async get(strategyId: string): Promise<StrategyAggregate | null> {
    const strategy = this.store.get(strategyId);
    if (!strategy) return null;
    return StrategyAggregate.fromPersisted(strategyId, strategy);
  }

  async getLatest(): Promise<StrategyAggregate | null> {
    if (!this.latestId) return null;
    return this.get(this.latestId);
  }

  async reset(): Promise<void> {
    this.store.clear();
    this.latestId = null;
  }
}
