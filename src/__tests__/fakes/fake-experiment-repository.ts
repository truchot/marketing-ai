import type { IExperimentRepository } from "@/domains/experimentation/ports";
import type { Experiment } from "@/types/experiment";

/**
 * Standalone in-memory experiment repository for tests.
 * Each instance has its own isolated state (no shared globals).
 */
export class FakeExperimentRepository implements IExperimentRepository {
  private store = new Map<string, Experiment>();

  async save(experiment: Experiment): Promise<string> {
    this.store.set(experiment.id, experiment);
    return experiment.id;
  }

  async get(experimentId: string): Promise<Experiment | null> {
    return this.store.get(experimentId) ?? null;
  }

  async list(): Promise<Experiment[]> {
    return [...this.store.values()];
  }

  async listByKeyResult(keyResultId: string): Promise<Experiment[]> {
    return (await this.list()).filter((e) => e.keyResultId === keyResultId);
  }

  async listByWeek(weekOf: string): Promise<Experiment[]> {
    return (await this.list()).filter((e) => e.weekOf === weekOf);
  }

  async reset(): Promise<void> {
    this.store.clear();
  }
}
