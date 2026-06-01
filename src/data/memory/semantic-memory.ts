import {
  ClientFact,
  Preference,
  ConfidenceLevel,
  ValidatedPattern,
  LearnedRule,
  SemanticContext,
} from "@/types/memory";
import type { ISemanticMemoryRepository } from "@/domains/memory/ports";

/**
 * In-memory semantic store. Kept as the test double for the Memory context.
 * Production uses the Prisma-backed implementation (see ./prisma-semantic-memory).
 */
export class SemanticMemoryStore implements ISemanticMemoryRepository {
  private clientFacts: ClientFact[] = [];
  private preferences: Preference[] = [];
  private validatedPatterns: ValidatedPattern[] = [];
  private learnedRules: LearnedRule[] = [];

  async addClientFact(category: string, fact: string, source: string): Promise<ClientFact> {
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

  async addPreference(
    category: string,
    key: string,
    value: string,
    confidence: ConfidenceLevel
  ): Promise<Preference> {
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

  async addValidatedPattern(
    type: string,
    description: string,
    trigger: string,
    outcome: string,
    recommendation: string
  ): Promise<ValidatedPattern> {
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

  async addLearnedRule(
    description: string,
    domain: string,
    action: string,
    confidence: ConfidenceLevel
  ): Promise<LearnedRule> {
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

  async reset(): Promise<void> {
    this.clientFacts = [];
    this.preferences = [];
    this.validatedPatterns = [];
    this.learnedRules = [];
  }

  async getSemanticContext(): Promise<SemanticContext> {
    return {
      clientFacts: [...this.clientFacts],
      preferences: [...this.preferences],
      validatedPatterns: [...this.validatedPatterns],
      learnedRules: [...this.learnedRules],
    };
  }

  async getClientFacts(): Promise<ClientFact[]> {
    return this.clientFacts;
  }

  async getPreferences(): Promise<Preference[]> {
    return this.preferences;
  }

  async getValidatedPatterns(): Promise<ValidatedPattern[]> {
    return this.validatedPatterns;
  }

  async getLearnedRules(): Promise<LearnedRule[]> {
    return this.learnedRules;
  }
}
