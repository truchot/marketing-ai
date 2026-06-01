import type { IStrategyRepository } from "../ports";
import type { MarketingStrategy } from "@/types/marketing-strategy";
import { StrategyAggregate } from "../aggregates";
import { executeUseCase } from "@/domains/shared";

export class SaveStrategyUseCase {
  constructor(private strategyRepo: IStrategyRepository) {}

  execute(strategy: MarketingStrategy) {
    return executeUseCase(() => {
      const aggregate = StrategyAggregate.create(strategy);
      this.strategyRepo.save(aggregate.id, aggregate.toStrategy());
      aggregate.publishEvents();
      return aggregate.id;
    });
  }
}
