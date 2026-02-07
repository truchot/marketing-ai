import type { ISemanticMemoryRepository } from "../ports";
import type { ValidatedPattern } from "@/types/memory";
import { Result, ValidationError } from "@/domains/shared";

interface AddValidatedPatternInput {
  type: string;
  description: string;
  trigger: string;
  outcome: string;
  recommendation: string;
}

export class AddValidatedPatternUseCase {
  constructor(private semanticRepo: ISemanticMemoryRepository) {}

  execute(input: AddValidatedPatternInput): Result<ValidatedPattern> {
    try {
      const pattern = this.semanticRepo.addValidatedPattern(
        input.type,
        input.description,
        input.trigger,
        input.outcome,
        input.recommendation
      );
      return Result.ok(pattern);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown validation error"
      ));
    }
  }
}
