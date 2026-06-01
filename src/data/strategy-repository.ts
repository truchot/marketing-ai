// ============================================================
// PrismaStrategyRepository
// Normalized persistence: strategies + okrs + key_results + actions.
// Diagnostic/constraints embedded as columns; roadmap as JSON.
// ============================================================

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { IdGenerator } from "@/lib/id-generator";
import type { IStrategyRepository } from "@/domains/strategy/ports";
import type {
  MarketingStrategy,
  ExecutionRoadmap,
  OKR,
  KeyResult,
  ActionType,
  EffortLevel,
  ImpactLevel,
} from "@/types/marketing-strategy";

const include = {
  okrs: { include: { keyResults: true } },
  actions: true,
} as const;

type StrategyRow = Prisma.StrategyGetPayload<{ include: typeof include }>;

function toDto(row: StrategyRow): MarketingStrategy {
  return {
    metadata: {
      companyName: row.companyName,
      generatedAt: row.generatedAt,
      discoveryCompletionStatus:
        row.discoveryCompletionStatus as MarketingStrategy["metadata"]["discoveryCompletionStatus"],
      strategyVersion: row.strategyVersion,
    },
    diagnostic: {
      maturityScore: row.diagnosticMaturityScore,
      strengths: row.diagnosticStrengths,
      weaknesses: row.diagnosticWeaknesses,
      opportunities: row.diagnosticOpportunities,
      threats: row.diagnosticThreats,
      summary: row.diagnosticSummary,
    },
    okrs: row.okrs.map((o) => ({
      id: o.domainId,
      objective: o.objective,
      rationale: o.rationale,
      keyResults: o.keyResults.map((kr) => ({
        id: kr.domainId,
        metric: kr.metric,
        current: kr.current,
        target: kr.target,
        timeline: kr.timeline,
        confidence: kr.confidence as KeyResult["confidence"],
      })),
      priority: o.priority as OKR["priority"],
      linkedDiscoveryData: {
        fromBlock: o.linkedFromBlock as OKR["linkedDiscoveryData"]["fromBlock"],
        evidence: o.linkedEvidence,
      },
    })),
    actions: row.actions.map((a) => ({
      id: a.domainId,
      okrId: a.okrId,
      keyResultId: a.keyResultId,
      title: a.title,
      description: a.description,
      type: a.type as ActionType,
      effort: a.effort as EffortLevel,
      impact: a.impact as ImpactLevel,
      requiredSkills: a.requiredSkills,
      requiredTools: a.requiredTools,
      dependencies: a.dependencies,
      suggestedTimeline: a.suggestedTimeline,
      channel: a.channel ?? undefined,
      audienceSegment: a.audienceSegment ?? undefined,
    })),
    executionRoadmap: row.roadmap as unknown as ExecutionRoadmap,
    constraints: {
      budgetFit: row.constraintsBudgetFit,
      teamFit: row.constraintsTeamFit,
      adaptations: row.constraintsAdaptations,
    },
    narrativeSummary: row.narrativeSummary,
  };
}

export class PrismaStrategyRepository implements IStrategyRepository {
  async save(s: MarketingStrategy): Promise<string> {
    const id = IdGenerator.generate("strategy");
    await prisma.strategy.create({
      data: {
        id,
        companyName: s.metadata.companyName,
        generatedAt: s.metadata.generatedAt,
        discoveryCompletionStatus: s.metadata.discoveryCompletionStatus,
        strategyVersion: s.metadata.strategyVersion,
        narrativeSummary: s.narrativeSummary,
        diagnosticMaturityScore: s.diagnostic.maturityScore,
        diagnosticStrengths: s.diagnostic.strengths,
        diagnosticWeaknesses: s.diagnostic.weaknesses,
        diagnosticOpportunities: s.diagnostic.opportunities,
        diagnosticThreats: s.diagnostic.threats,
        diagnosticSummary: s.diagnostic.summary,
        constraintsBudgetFit: s.constraints.budgetFit,
        constraintsTeamFit: s.constraints.teamFit,
        constraintsAdaptations: s.constraints.adaptations,
        roadmap: s.executionRoadmap as unknown as Prisma.InputJsonValue,
        okrs: {
          create: s.okrs.map((o) => ({
            domainId: o.id,
            objective: o.objective,
            rationale: o.rationale,
            priority: o.priority,
            linkedFromBlock: o.linkedDiscoveryData.fromBlock,
            linkedEvidence: o.linkedDiscoveryData.evidence,
            keyResults: {
              create: o.keyResults.map((kr) => ({
                domainId: kr.id,
                metric: kr.metric,
                current: kr.current ?? null,
                target: kr.target,
                timeline: kr.timeline,
                confidence: kr.confidence,
              })),
            },
          })),
        },
        actions: {
          create: s.actions.map((a) => ({
            domainId: a.id,
            okrId: a.okrId,
            keyResultId: a.keyResultId,
            title: a.title,
            description: a.description,
            type: a.type,
            effort: a.effort,
            impact: a.impact,
            requiredSkills: a.requiredSkills,
            requiredTools: a.requiredTools,
            dependencies: a.dependencies,
            suggestedTimeline: a.suggestedTimeline,
            channel: a.channel ?? null,
            audienceSegment: a.audienceSegment ?? null,
          })),
        },
      },
    });
    return id;
  }

  async get(strategyId: string): Promise<MarketingStrategy | null> {
    const row = await prisma.strategy.findUnique({ where: { id: strategyId }, include });
    return row ? toDto(row) : null;
  }

  async getLatest(): Promise<MarketingStrategy | null> {
    const row = await prisma.strategy.findFirst({ orderBy: { seq: "desc" }, include });
    return row ? toDto(row) : null;
  }

  async reset(): Promise<void> {
    await prisma.strategy.deleteMany({});
  }
}

export const strategyRepository = new PrismaStrategyRepository();
