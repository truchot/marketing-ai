import type { ISemanticMemoryRepository } from "../ports";
import { executeUseCase } from "@/domains/shared";

interface AddValidatedPatternInput {
  type: string;
  description: string;
  trigger: string;
  outcome: string;
  recommendation: string;
}

export class AddValidatedPatternUseCase {
  constructor(private semanticRepo: ISemanticMemoryRepository) {}

  execute(input: AddValidatedPatternInput) {
    return executeUseCase(async () => {
      return this.semanticRepo.addValidatedPattern(
        input.type,
        input.description,
        input.trigger,
        input.outcome,
        input.recommendation
      );
    });
  }
}
