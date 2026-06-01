import type { IStrategyRepository } from "../ports";
import type { MarketingStrategy } from "@/types/marketing-strategy";
import { StrategyAggregate } from "../aggregates";
import { domainEventBus, Result, ValidationError } from "@/domains/shared";

export class SaveStrategyUseCase {
  constructor(private strategyRepo: IStrategyRepository) {}

  async execute(strategy: MarketingStrategy): Promise<Result<string>> {
    try {
      const aggregate = StrategyAggregate.create(strategy);

      // Publish domain events
      const events = aggregate.getUncommittedEvents();
      events.forEach((event) => domainEventBus.publish(event));
      aggregate.clearUncommittedEvents();

      // Persist
      const id = await this.strategyRepo.save(aggregate.toStrategy());
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
