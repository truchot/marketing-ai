import type { MarketingStrategy } from "@/types/marketing-strategy";

export interface IStrategyRepository {
  save(strategy: MarketingStrategy): string;
  get(strategyId: string): MarketingStrategy | null;
  getLatest(): MarketingStrategy | null;
  reset(): void;
}
