import type { IExperimentRepository } from "../ports";
import type { Experiment } from "@/types/experiment";
import { ExperimentAggregate } from "../aggregates";
import type { CreateExperimentInput } from "../aggregates";
import { domainEventBus, Result, ValidationError } from "@/domains/shared";

/**
 * A backlog candidate is a net-new experiment. ICE (including confidence,
 * fed by the data sources) and the hypothesis are produced upstream
 * (growth-strategist agent / data tools). Experiments are tied to a
 * KeyResult — not to a strategy Action.
 */
export type BacklogItem = { kind: "raw"; input: CreateExperimentInput };

/**
 * Build the weekly experiment backlog: create each candidate (enforcing the
 * aggregate invariants), persist as draft, publish EXPERIMENT_CREATED, and
 * return the experiments ranked by ICE priority (desc).
 *
 * Pure orchestration — this use case does not call any model.
 */
export class GenerateBacklogUseCase {
  constructor(private readonly experimentRepo: IExperimentRepository) {}

  async execute(items: BacklogItem[]): Promise<Result<Experiment[]>> {
    try {
      if (items.length === 0) {
        return Result.fail(
          new ValidationError("Backlog generation requires at least one candidate")
        );
      }

      const aggregates = items.map((item) => ExperimentAggregate.create(item.input));

      for (const agg of aggregates) {
        agg.getUncommittedEvents().forEach((event) => domainEventBus.publish(event));
        agg.clearUncommittedEvents();
        await this.experimentRepo.save(agg.toDTO());
      }

      const ranked = [...aggregates]
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .map((a) => a.toDTO());

      return Result.ok(ranked);
    } catch (error) {
      return Result.fail(
        new ValidationError(error instanceof Error ? error.message : "Unknown error")
      );
    }
  }
}
