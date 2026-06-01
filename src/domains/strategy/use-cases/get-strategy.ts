import type { IStrategyRepository } from "../ports";
import type { StrategyAggregate } from "../aggregates";
import { Result, NotFoundError } from "@/domains/shared";

export class GetStrategyUseCase {
  constructor(private strategyRepo: IStrategyRepository) {}

  async execute(strategyId?: string): Promise<Result<StrategyAggregate>> {
    const aggregate = strategyId
      ? await this.strategyRepo.get(strategyId)
      : await this.strategyRepo.getLatest();

    if (!aggregate) {
      return Result.fail(
        new NotFoundError(
          strategyId ? `Strategy ${strategyId} not found` : "No strategy found"
        )
      );
    }

    return Result.ok(aggregate);
  }
}
