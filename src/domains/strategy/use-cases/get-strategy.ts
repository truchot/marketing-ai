import type { IStrategyRepository } from "../ports";
import type { StrategyAggregate } from "../aggregates";
import { Result, NotFoundError } from "@/domains/shared";

export class GetStrategyUseCase {
  constructor(private strategyRepo: IStrategyRepository) {}

  execute(strategyId?: string): Result<StrategyAggregate> {
    const aggregate = strategyId
      ? this.strategyRepo.get(strategyId)
      : this.strategyRepo.getLatest();

    if (!aggregate) {
      return Result.fail(
        new NotFoundError(
          strategyId
            ? `Strategy ${strategyId} not found`
            : "No strategy found"
        )
      );
    }

    return Result.ok(aggregate);
  }
}
