import type { IStrategyRepository } from "../ports";
import type { MarketingStrategy } from "@/types/marketing-strategy";
import { Result, NotFoundError } from "@/domains/shared";

export class GetStrategyUseCase {
  constructor(private strategyRepo: IStrategyRepository) {}

  execute(strategyId?: string): Result<MarketingStrategy> {
    const strategy = strategyId
      ? this.strategyRepo.get(strategyId)
      : this.strategyRepo.getLatest();

    if (!strategy) {
      return Result.fail(
        new NotFoundError(
          strategyId
            ? `Strategy ${strategyId} not found`
            : "No strategy found"
        )
      );
    }

    return Result.ok(strategy);
  }
}
