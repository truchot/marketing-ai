import type { IExperimentRepository } from "../ports";
import type { Experiment, DailyActionStatus } from "@/types/experiment";
import { ExperimentAggregate } from "../aggregates";

/**
 * Flattened, founder-facing view of a single daily atom, with the causal trail
 * back to its KeyResult. Answers "what do I ship today?".
 */
export interface DailyPlanEntry {
  dailyActionId: string;
  experimentId: string;
  experimentTitle: string;
  keyResultId: string;
  priorityScore: number;
  scheduledDate: string;
  channel: string;
  title: string;
  status: DailyActionStatus;
  hasAsset: boolean;
}

function byPriorityThenDate(a: DailyPlanEntry, b: DailyPlanEntry): number {
  if (b.priorityScore !== a.priorityScore) {
    return b.priorityScore - a.priorityScore;
  }
  return a.scheduledDate.localeCompare(b.scheduledDate);
}

/**
 * Read-model (projection), NOT an aggregate. Aplatit les DailyAction de tous
 * les Experiment pour offrir une vue quotidienne / hebdomadaire du backlog.
 */
export class DailyPlanProjection {
  constructor(private readonly experimentRepo: IExperimentRepository) {}

  /** Daily atoms scheduled on a given day, across all experiments. */
  async forDate(date: string): Promise<DailyPlanEntry[]> {
    const experiments = await this.experimentRepo.list();
    return this.entriesFrom(experiments)
      .filter((entry) => entry.scheduledDate === date)
      .sort(byPriorityThenDate);
  }

  /** All daily atoms of the experiments selected for a given week. */
  async forWeek(weekOf: string): Promise<DailyPlanEntry[]> {
    const experiments = await this.experimentRepo.listByWeek(weekOf);
    return this.entriesFrom(experiments).sort(byPriorityThenDate);
  }

  private entriesFrom(experiments: Experiment[]): DailyPlanEntry[] {
    const entries: DailyPlanEntry[] = [];
    for (const dto of experiments) {
      // Reuse the aggregate's ICE formula rather than duplicating it.
      const priorityScore = ExperimentAggregate.fromPersisted(dto).priorityScore;
      for (const daily of dto.dailyActions) {
        entries.push({
          dailyActionId: daily.id,
          experimentId: dto.id,
          experimentTitle: dto.title,
          keyResultId: dto.keyResultId,
          priorityScore,
          scheduledDate: daily.scheduledDate,
          channel: daily.channel,
          title: daily.title,
          status: daily.status,
          hasAsset: daily.asset !== null,
        });
      }
    }
    return entries;
  }
}
