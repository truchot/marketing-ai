import type { ISemanticMemoryRepository } from "../ports";
import type { ConfidenceLevel } from "@/types/memory";
import {
  domainEventBus,
  PREFERENCE_UPDATED,
  ConfidenceLevel as ConfidenceLevelVO,
  executeUseCase,
} from "@/domains/shared";

interface AddPreferenceInput {
  category: string;
  key: string;
  value: string;
  confidence: ConfidenceLevel;
}

export class AddPreferenceUseCase {
  constructor(private semanticRepo: ISemanticMemoryRepository) {}

  execute(input: AddPreferenceInput) {
    return executeUseCase(async () => {
      ConfidenceLevelVO.create(input.confidence);
      const pref = await this.semanticRepo.addPreference(
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
      return pref;
    });
  }
}
