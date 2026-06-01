import type { IStrategyRepository } from "@/domains/strategy/ports";
import type { MarketingStrategy } from "@/types/marketing-strategy";
import { StrategyAggregate } from "@/domains/strategy/aggregates";

const store = new Map<string, MarketingStrategy>();
let latestId: string | null = null;

export class InMemoryStrategyRepository implements IStrategyRepository {
  save(id: string, strategy: MarketingStrategy): void {
    store.set(id, strategy);
    latestId = id;
  }

  get(strategyId: string): StrategyAggregate | null {
    const strategy = store.get(strategyId);
    if (!strategy) return null;
    return StrategyAggregate.fromPersisted(strategyId, strategy);
  }

  getLatest(): StrategyAggregate | null {
    if (!latestId) return null;
    return this.get(latestId);
  }

  reset(): void {
    store.clear();
    latestId = null;
  }
}

export const strategyRepository = new InMemoryStrategyRepository();
