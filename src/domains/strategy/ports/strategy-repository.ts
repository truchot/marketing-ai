import type { MarketingStrategy } from "@/types/marketing-strategy";

export interface IStrategyRepository {
  save(strategy: MarketingStrategy): Promise<string>;
  get(strategyId: string): Promise<MarketingStrategy | null>;
  getLatest(): Promise<MarketingStrategy | null>;
  reset(): Promise<void>;
}
