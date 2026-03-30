import type { MarketingStrategy } from "@/types/marketing-strategy";

export interface IStrategyRepository {
  save(id: string, strategy: MarketingStrategy): void;
  get(strategyId: string): MarketingStrategy | null;
  getLatest(): MarketingStrategy | null;
  reset(): void;
}
