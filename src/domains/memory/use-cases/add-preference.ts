import type { ISemanticMemoryRepository } from "../ports";
import type { Preference, ConfidenceLevel } from "@/types/memory";
import { domainEventBus, PREFERENCE_UPDATED, ConfidenceLevel as ConfidenceLevelVO, Result, ValidationError } from "@/domains/shared";

interface AddPreferenceInput {
  category: string;
  key: string;
  value: string;
  confidence: ConfidenceLevel;
}

export class AddPreferenceUseCase {
  constructor(private semanticRepo: ISemanticMemoryRepository) {}

  execute(input: AddPreferenceInput): Result<Preference> {
    try {
      // Validate via Value Object
      ConfidenceLevelVO.create(input.confidence);

      const pref = this.semanticRepo.addPreference(
        input.category,
        input.key,
        input.value,
        input.confidence
      );
      domainEventBus.publish({
        type: PREFERENCE_UPDATED,
        occurredAt: new Date().toISOString(),
        payload: {
          preferenceId: pref.id,
          category: input.category,
          key: input.key,
        },
      });
      return Result.ok(pref);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown validation error"
      ));
    }
  }
}
