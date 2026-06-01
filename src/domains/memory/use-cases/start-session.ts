import type { IWorkingMemoryRepository } from "../ports";
import { Result, ValidationError } from "@/domains/shared";

interface StartSessionInput {
  task: string;
  objective: string;
}

export class StartSessionUseCase {
  constructor(private workingRepo: IWorkingMemoryRepository) {}

  async execute(input: StartSessionInput): Promise<Result<void>> {
    try {
      await this.workingRepo.startSession(input.task, input.objective);
      return Result.ok(undefined as void);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown session error"
      ));
    }
  }
}
