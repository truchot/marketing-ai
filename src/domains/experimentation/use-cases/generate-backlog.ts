import type { IExperimentRepository } from "../ports";
import type { Experiment, Hypothesis, ConfidenceSource } from "@/types/experiment";
import type { Action } from "@/types/marketing-strategy";
import { ExperimentAggregate } from "../aggregates";
import type { CreateExperimentInput } from "../aggregates";
import { domainEventBus, Result, ValidationError } from "@/domains/shared";

/**
 * A backlog candidate is either a net-new experiment (raw input) or the
 * promotion of an existing strategic Action into a testable experiment.
 */
export type BacklogItem =
  | { kind: "raw"; input: CreateExperimentInput }
  | {
      kind: "fromAction";
      action: Action;
      hypothesis: Hypothesis;
      confidence: number; // 1-10, fed by the data sources
      companyName: string;
      confidenceSources?: ConfidenceSource[];
      title?: string;
      channel?: string;
    };

/**
 * Build the weekly experiment backlog: create each candidate (enforcing the
 * aggregate invariants), persist as draft, publish EXPERIMENT_CREATED, and
 * return the experiments ranked by ICE priority (desc).
 *
 * Pure orchestration — the hypotheses/confidence are produced upstream
 * (LLM endpoint / data tools). This use case does not call any model.
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

      const aggregates = items.map((item) =>
        item.kind === "fromAction"
          ? ExperimentAggregate.promoteFromAction(item.action, {
              hypothesis: item.hypothesis,
              confidence: item.confidence,
              confidenceSources: item.confidenceSources,
              companyName: item.companyName,
              title: item.title,
              channel: item.channel,
            })
          : ExperimentAggregate.create(item.input)
      );

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
