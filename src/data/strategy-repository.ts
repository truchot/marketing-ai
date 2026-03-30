import type { IStrategyRepository } from "@/domains/strategy/ports";
import type { MarketingStrategy } from "@/types/marketing-strategy";

const store = new Map<string, MarketingStrategy>();
let latestId: string | null = null;

export class InMemoryStrategyRepository implements IStrategyRepository {
  save(id: string, strategy: MarketingStrategy): void {
    store.set(id, strategy);
    latestId = id;
  }

  get(strategyId: string): MarketingStrategy | null {
    return store.get(strategyId) ?? null;
  }

  getLatest(): MarketingStrategy | null {
    if (!latestId) return null;
    return store.get(latestId) ?? null;
  }

  reset(): void {
    store.clear();
    latestId = null;
  }
}

export const strategyRepository = new InMemoryStrategyRepository();
