import type { IStrategyRepository } from "../ports";
import type { MarketingStrategy } from "@/types/marketing-strategy";
import { StrategyAggregate } from "../aggregates";
import { Result, ValidationError } from "@/domains/shared";

export class SaveStrategyUseCase {
  constructor(private strategyRepo: IStrategyRepository) {}

  execute(strategy: MarketingStrategy): Result<string> {
    try {
      const aggregate = StrategyAggregate.create(strategy);

      // Publish domain events
      aggregate.publishEvents();

      // Persist
      const id = this.strategyRepo.save(aggregate.toStrategy());
      return Result.ok(id);
    } catch (error) {
      return Result.fail(
        new ValidationError(
          error instanceof Error ? error.message : "Unknown validation error"
        )
      );
    }
  }
}
