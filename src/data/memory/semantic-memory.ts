import {
  ClientFact,
  Preference,
  ConfidenceLevel,
  ValidatedPattern,
  LearnedRule,
  SemanticContext,
} from "@/types/memory";
import type { ISemanticMemoryRepository } from "@/domains/memory/ports";

export class SemanticMemoryStore implements ISemanticMemoryRepository {
  private clientFacts: ClientFact[] = [];
  private preferences: Preference[] = [];
  private validatedPatterns: ValidatedPattern[] = [];
  private learnedRules: LearnedRule[] = [];

  addClientFact(category: string, fact: string, source: string): ClientFact {
    const cf: ClientFact = {
      id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category,
      fact,
      source,
      addedAt: new Date().toISOString(),
    };
    this.clientFacts.push(cf);
    return cf;
  }

  addPreference(
    category: string,
    key: string,
    value: string,
    confidence: ConfidenceLevel
  ): Preference {
    const existing = this.preferences.find(
      (p) => p.category === category && p.key === key
    );
    if (existing) {
      existing.value = value;
      existing.confidence = confidence;
      return existing;
    }
    const pref: Preference = {
      id: `pref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      category,
      key,
      value,
      confidence,
      addedAt: new Date().toISOString(),
    };
    this.preferences.push(pref);
    return pref;
  }

  addValidatedPattern(
    type: string,
    description: string,
    trigger: string,
    outcome: string,
    recommendation: string
  ): ValidatedPattern {
    const vp: ValidatedPattern = {
      id: `pat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      description,
      trigger,
      outcome,
      recommendation,
      validatedAt: new Date().toISOString(),
    };
    this.validatedPatterns.push(vp);
    return vp;
  }

  addLearnedRule(
    description: string,
    domain: string,
    action: string,
    confidence: ConfidenceLevel
  ): LearnedRule {
    const lr: LearnedRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      description,
      domain,
      action,
      confidence,
      addedAt: new Date().toISOString(),
    };
    this.learnedRules.push(lr);
    return lr;
  }

  reset(): void {
    this.clientFacts = [];
    this.preferences = [];
    this.validatedPatterns = [];
    this.learnedRules = [];
  }

  getSemanticContext(): SemanticContext {
    return {
      clientFacts: [...this.clientFacts],
      preferences: [...this.preferences],
      validatedPatterns: [...this.validatedPatterns],
      learnedRules: [...this.learnedRules],
    };
  }

  getClientFacts(): ClientFact[] {
    return this.clientFacts;
  }

  getPreferences(): Preference[] {
    return this.preferences;
  }

  getValidatedPatterns(): ValidatedPattern[] {
    return this.validatedPatterns;
  }

  getLearnedRules(): LearnedRule[] {
    return this.learnedRules;
  }
}
