import type { IWorkingMemoryRepository } from "../ports";

interface StartSessionInput {
  task: string;
  objective: string;
}

export class StartSessionUseCase {
  constructor(private workingRepo: IWorkingMemoryRepository) {}

  execute(input: StartSessionInput): void {
    this.workingRepo.startSession(input.task, input.objective);
  }
}
