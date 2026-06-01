import type {
  ClientFact,
  Preference,
  ConfidenceLevel,
  ValidatedPattern,
  LearnedRule,
  SemanticContext,
} from "@/types/memory";

export interface ISemanticMemoryRepository {
  addClientFact(category: string, fact: string, source: string): Promise<ClientFact>;

  addPreference(
    category: string,
    key: string,
    value: string,
    confidence: ConfidenceLevel
  ): Promise<Preference>;

  addValidatedPattern(
    type: string,
    description: string,
    trigger: string,
    outcome: string,
    recommendation: string
  ): Promise<ValidatedPattern>;

  addLearnedRule(
    description: string,
    domain: string,
    action: string,
    confidence: ConfidenceLevel
  ): Promise<LearnedRule>;

  getSemanticContext(): Promise<SemanticContext>;
  getClientFacts(): Promise<ClientFact[]>;
  getPreferences(): Promise<Preference[]>;
  getValidatedPatterns(): Promise<ValidatedPattern[]>;
  getLearnedRules(): Promise<LearnedRule[]>;
  reset(): Promise<void>; // For testing
}
