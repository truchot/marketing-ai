import type { MarketingStrategy } from "@/types/marketing-strategy";
import type { StrategyAggregate } from "../aggregates";

export interface IStrategyRepository {
  save(id: string, strategy: MarketingStrategy): void;
  get(strategyId: string): StrategyAggregate | null;
  getLatest(): StrategyAggregate | null;
  reset(): void;
}
