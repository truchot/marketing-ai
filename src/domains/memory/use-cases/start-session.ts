import type { IWorkingMemoryRepository } from "../ports";
import { executeUseCase } from "@/domains/shared";

interface StartSessionInput {
  task: string;
  objective: string;
}

export class StartSessionUseCase {
  constructor(private workingRepo: IWorkingMemoryRepository) {}

  execute(input: StartSessionInput) {
    return executeUseCase(async () => {
      await this.workingRepo.startSession(input.task, input.objective);
    });
  }
}
