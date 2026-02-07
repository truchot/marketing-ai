import type { ISemanticMemoryRepository } from "../ports";
import type { ValidatedPattern } from "@/types/memory";

interface AddValidatedPatternInput {
  type: string;
  description: string;
  trigger: string;
  outcome: string;
  recommendation: string;
}

export class AddValidatedPatternUseCase {
  constructor(private semanticRepo: ISemanticMemoryRepository) {}

  execute(input: AddValidatedPatternInput): ValidatedPattern {
    return this.semanticRepo.addValidatedPattern(
      input.type,
      input.description,
      input.trigger,
      input.outcome,
      input.recommendation
    );
  }
}
