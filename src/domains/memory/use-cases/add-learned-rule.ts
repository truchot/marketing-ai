import type { ISemanticMemoryRepository } from "../ports";
import type { LearnedRule, ConfidenceLevel } from "@/types/memory";
import { ConfidenceLevel as ConfidenceLevelVO, Result, ValidationError } from "@/domains/shared";

interface AddLearnedRuleInput {
  description: string;
  domain: string;
  action: string;
  confidence: ConfidenceLevel;
}

export class AddLearnedRuleUseCase {
  constructor(private semanticRepo: ISemanticMemoryRepository) {}

  execute(input: AddLearnedRuleInput): Result<LearnedRule> {
    try {
      // Validate via Value Object
      ConfidenceLevelVO.create(input.confidence);

      const rule = this.semanticRepo.addLearnedRule(
        input.description,
        input.domain,
        input.action,
        input.confidence
      );
      return Result.ok(rule);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown validation error"
      ));
    }
  }
}
