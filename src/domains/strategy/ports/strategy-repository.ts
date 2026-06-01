import type { MarketingStrategy } from "@/types/marketing-strategy";
import type { StrategyAggregate } from "../aggregates";

export interface IStrategyRepository {
  save(id: string, strategy: MarketingStrategy): Promise<void>;
  get(strategyId: string): Promise<StrategyAggregate | null>;
  getLatest(): Promise<StrategyAggregate | null>;
  reset(): Promise<void>;
}
