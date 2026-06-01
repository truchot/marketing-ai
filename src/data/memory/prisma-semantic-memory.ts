// ============================================================
// PrismaSemanticMemoryRepository
// client_facts + preferences (upsert by category+key) +
// validated_patterns + learned_rules.
// ============================================================

import { prisma } from "@/lib/prisma";
import { IdGenerator } from "@/lib/id-generator";
import type { ISemanticMemoryRepository } from "@/domains/memory/ports";
import type {
  ClientFact,
  Preference,
  ConfidenceLevel,
  ValidatedPattern,
  LearnedRule,
  SemanticContext,
} from "@/types/memory";

function prefDto(r: {
  id: string;
  category: string;
  key: string;
  value: string;
  confidence: string;
  addedAt: string;
}): Preference {
  return {
    id: r.id,
    category: r.category,
    key: r.key,
    value: r.value,
    confidence: r.confidence as ConfidenceLevel,
    addedAt: r.addedAt,
  };
}

function ruleDto(r: {
  id: string;
  description: string;
  domain: string;
  action: string;
  confidence: string;
  addedAt: string;
}): LearnedRule {
  return {
    id: r.id,
    description: r.description,
    domain: r.domain,
    action: r.action,
    confidence: r.confidence as ConfidenceLevel,
    addedAt: r.addedAt,
  };
}

export class PrismaSemanticMemoryRepository implements ISemanticMemoryRepository {
  async addClientFact(category: string, fact: string, source: string): Promise<ClientFact> {
    return prisma.clientFact.create({
      data: { id: IdGenerator.generate("fact"), category, fact, source, addedAt: IdGenerator.timestamp() },
    });
  }

  async addPreference(
    category: string,
    key: string,
    value: string,
    confidence: ConfidenceLevel
  ): Promise<Preference> {
    const row = await prisma.preference.upsert({
      where: { category_key: { category, key } },
      update: { value, confidence },
      create: {
        id: IdGenerator.generate("pref"),
        category,
        key,
        value,
        confidence,
        addedAt: IdGenerator.timestamp(),
      },
    });
    return prefDto(row);
  }

  async addValidatedPattern(
    type: string,
    description: string,
    trigger: string,
    outcome: string,
    recommendation: string
  ): Promise<ValidatedPattern> {
    return prisma.validatedPattern.create({
      data: {
        id: IdGenerator.generate("pat"),
        type,
        description,
        trigger,
        outcome,
        recommendation,
        validatedAt: IdGenerator.timestamp(),
      },
    });
  }

  async addLearnedRule(
    description: string,
    domain: string,
    action: string,
    confidence: ConfidenceLevel
  ): Promise<LearnedRule> {
    const row = await prisma.learnedRule.create({
      data: {
        id: IdGenerator.generate("rule"),
        description,
        domain,
        action,
        confidence,
        addedAt: IdGenerator.timestamp(),
      },
    });
    return ruleDto(row);
  }

  async getSemanticContext(): Promise<SemanticContext> {
    const [clientFacts, preferences, validatedPatterns, learnedRules] = await Promise.all([
      prisma.clientFact.findMany({ orderBy: { seq: "asc" } }),
      prisma.preference.findMany({ orderBy: { seq: "asc" } }),
      prisma.validatedPattern.findMany({ orderBy: { seq: "asc" } }),
      prisma.learnedRule.findMany({ orderBy: { seq: "asc" } }),
    ]);
    return {
      clientFacts,
      preferences: preferences.map(prefDto),
      validatedPatterns,
      learnedRules: learnedRules.map(ruleDto),
    };
  }

  async getClientFacts(): Promise<ClientFact[]> {
    return prisma.clientFact.findMany({ orderBy: { seq: "asc" } });
  }

  async getPreferences(): Promise<Preference[]> {
    const rows = await prisma.preference.findMany({ orderBy: { seq: "asc" } });
    return rows.map(prefDto);
  }

  async getValidatedPatterns(): Promise<ValidatedPattern[]> {
    return prisma.validatedPattern.findMany({ orderBy: { seq: "asc" } });
  }

  async getLearnedRules(): Promise<LearnedRule[]> {
    const rows = await prisma.learnedRule.findMany({ orderBy: { seq: "asc" } });
    return rows.map(ruleDto);
  }

  async reset(): Promise<void> {
    await prisma.$transaction([
      prisma.clientFact.deleteMany({}),
      prisma.preference.deleteMany({}),
      prisma.validatedPattern.deleteMany({}),
      prisma.learnedRule.deleteMany({}),
    ]);
  }
}
