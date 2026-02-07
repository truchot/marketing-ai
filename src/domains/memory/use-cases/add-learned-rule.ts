import type { ISemanticMemoryRepository } from "../ports";
import type { LearnedRule, ConfidenceLevel } from "@/types/memory";
import { ConfidenceLevel as ConfidenceLevelVO } from "@/domains/shared";

interface AddLearnedRuleInput {
  description: string;
  domain: string;
  action: string;
  confidence: ConfidenceLevel;
}

export class AddLearnedRuleUseCase {
  constructor(private semanticRepo: ISemanticMemoryRepository) {}

  execute(input: AddLearnedRuleInput): LearnedRule {
    // Validate via Value Object
    ConfidenceLevelVO.create(input.confidence);

    return this.semanticRepo.addLearnedRule(
      input.description,
      input.domain,
      input.action,
      input.confidence
    );
  }
}
