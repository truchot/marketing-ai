import type { ISemanticMemoryRepository } from "../ports";
import type { ConfidenceLevel } from "@/types/memory";
import { ConfidenceLevel as ConfidenceLevelVO, executeUseCase } from "@/domains/shared";

interface AddLearnedRuleInput {
  description: string;
  domain: string;
  action: string;
  confidence: ConfidenceLevel;
}

export class AddLearnedRuleUseCase {
  constructor(private semanticRepo: ISemanticMemoryRepository) {}

  execute(input: AddLearnedRuleInput) {
    return executeUseCase(async () => {
      ConfidenceLevelVO.create(input.confidence);
      return this.semanticRepo.addLearnedRule(
        input.description,
        input.domain,
        input.action,
        input.confidence
      );
    });
  }
}
