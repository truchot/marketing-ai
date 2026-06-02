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

// Shared via globalThis so all Next dev route bundles see the same strategies
// (see business-discovery-repository for the rationale).
const globalForStrategy = globalThis as unknown as {
  __strategyRepository?: InMemoryStrategyRepository;
};
export const strategyRepository =
  globalForStrategy.__strategyRepository ??
  (globalForStrategy.__strategyRepository = new InMemoryStrategyRepository());
