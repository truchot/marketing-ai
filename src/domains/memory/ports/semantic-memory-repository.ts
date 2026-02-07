import type {
  ClientFact,
  Preference,
  ConfidenceLevel,
  ValidatedPattern,
  LearnedRule,
  SemanticContext,
} from "@/types/memory";

export interface ISemanticMemoryRepository {
  addClientFact(category: string, fact: string, source: string): ClientFact;

  addPreference(
    category: string,
    key: string,
    value: string,
    confidence: ConfidenceLevel
  ): Preference;

  addValidatedPattern(
    type: string,
    description: string,
    trigger: string,
    outcome: string,
    recommendation: string
  ): ValidatedPattern;

  addLearnedRule(
    description: string,
    domain: string,
    action: string,
    confidence: ConfidenceLevel
  ): LearnedRule;

  getSemanticContext(): SemanticContext;
  getClientFacts(): ClientFact[];
  getPreferences(): Preference[];
  getValidatedPatterns(): ValidatedPattern[];
  getLearnedRules(): LearnedRule[];
}
