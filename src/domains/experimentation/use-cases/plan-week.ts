import type { IExperimentRepository } from "../ports";
import type { Experiment } from "@/types/experiment";
import { ExperimentAggregate } from "../aggregates";
import { Result, ValidationError, NotFoundError } from "@/domains/shared";

export interface PlanWeekItem {
  experimentId: string;
  dailyAtoms: Array<{ scheduledDate: string; title: string; channel?: string }>;
}

export interface PlanWeekInput {
  weekOf: string; // ISO date of the Monday
  capacityPerWeek: number; // founder capacity: max total daily atoms (copilot)
  items: PlanWeekItem[];
}

/**
 * Decline the selected experiments of a week into daily actions, bounded by
 * the founder's weekly capacity. All-or-nothing: nothing is persisted unless
 * every experiment is found, in draft, and the capacity holds.
 */
export class PlanWeekUseCase {
  constructor(private readonly experimentRepo: IExperimentRepository) {}

  async execute(input: PlanWeekInput): Promise<Result<Experiment[]>> {
    try {
      const totalAtoms = input.items.reduce((sum, it) => sum + it.dailyAtoms.length, 0);
      if (totalAtoms > input.capacityPerWeek) {
        return Result.fail(
          new ValidationError(
            `Weekly capacity exceeded: ${totalAtoms} atoms planned for a capacity of ${input.capacityPerWeek}`
          )
        );
      }

      // Load + validate everything before mutating (all-or-nothing).
      const loaded = await Promise.all(
        input.items.map(async (it) => {
          const dto = await this.experimentRepo.get(it.experimentId);
          if (!dto) {
            throw new NotFoundError(`Experiment ${it.experimentId} not found`);
          }
          return { agg: ExperimentAggregate.fromPersisted(dto), atoms: it.dailyAtoms };
        })
      );

      // Apply in memory (throws here leave the store untouched).
      for (const { agg, atoms } of loaded) {
        agg.selectForWeek(input.weekOf);
        for (const atom of atoms) {
          agg.planDailyAction(atom);
        }
      }

      // Persist only once all mutations succeeded.
      const updated: Experiment[] = [];
      for (const { agg } of loaded) {
        const dto = agg.toDTO();
        await this.experimentRepo.save(dto);
        updated.push(dto);
      }

      return Result.ok(updated);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return Result.fail(error);
      }
      return Result.fail(
        new ValidationError(error instanceof Error ? error.message : "Unknown error")
      );
    }
  }
}
