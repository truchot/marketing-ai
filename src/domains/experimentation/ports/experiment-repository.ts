import type { Experiment } from "@/types/experiment";

/**
 * Repository port for the Experimentation context.
 * Persists Experiment aggregates (as DTOs) keyed by their own id (upsert).
 */
export interface IExperimentRepository {
  /** Upsert an experiment (keyed by experiment.id). Returns the id. */
  save(experiment: Experiment): Promise<string>;
  get(experimentId: string): Promise<Experiment | null>;
  list(): Promise<Experiment[]>;
  /** All experiments serving a given KeyResult (the guardrail link). */
  listByKeyResult(keyResultId: string): Promise<Experiment[]>;
  /** All experiments selected for a given week (weekOf, ISO date of the Monday). */
  listByWeek(weekOf: string): Promise<Experiment[]>;
  reset(): Promise<void>;
}
