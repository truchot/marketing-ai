import type { IExperimentRepository } from "../ports";
import type { Experiment, DailyActionAsset } from "@/types/experiment";
import { ExperimentAggregate } from "../aggregates";
import { Result, ValidationError, NotFoundError } from "@/domains/shared";

export interface ProduceAssetInput {
  experimentId: string;
  dailyActionId: string;
  asset: DailyActionAsset;
}

/**
 * Attach a produced asset to a daily action (the machine produces; the founder
 * validates/ships separately, via the aggregate). Persists the updated experiment.
 */
export class ProduceAssetUseCase {
  constructor(private readonly experimentRepo: IExperimentRepository) {}

  async execute(input: ProduceAssetInput): Promise<Result<Experiment>> {
    try {
      const dto = await this.experimentRepo.get(input.experimentId);
      if (!dto) {
        return Result.fail(new NotFoundError(`Experiment ${input.experimentId} not found`));
      }

      const agg = ExperimentAggregate.fromPersisted(dto);
      agg.produceAsset(input.dailyActionId, input.asset);

      const saved = agg.toDTO();
      await this.experimentRepo.save(saved);
      return Result.ok(saved);
    } catch (error) {
      return Result.fail(
        new ValidationError(error instanceof Error ? error.message : "Unknown error")
      );
    }
  }
}
