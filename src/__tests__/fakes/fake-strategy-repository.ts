import type { IStrategyRepository } from "@/domains/strategy/ports";
import type { MarketingStrategy } from "@/types/marketing-strategy";

/**
 * Standalone in-memory strategy repository for tests.
 * Each instance has its own isolated state (no shared globals).
 */
export class FakeStrategyRepository implements IStrategyRepository {
  private store = new Map<string, MarketingStrategy>();
  private latestId: string | null = null;
  private counter = 0;

  save(strategy: MarketingStrategy): string {
    this.counter += 1;
    const id = `strategy-test-${this.counter}`;
    this.store.set(id, strategy);
    this.latestId = id;
    return id;
  }

  get(strategyId: string): MarketingStrategy | null {
    return this.store.get(strategyId) ?? null;
  }

  getLatest(): MarketingStrategy | null {
    if (!this.latestId) return null;
    return this.store.get(this.latestId) ?? null;
  }

  getAll(): MarketingStrategy[] {
    return [...this.store.values()];
  }

  reset(): void {
    this.store.clear();
    this.latestId = null;
    this.counter = 0;
  }
}
