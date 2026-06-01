// ============================================================
// PrismaExperimentRepository
// Postgres-backed implementation of IExperimentRepository.
// Maps the Experiment DTO ↔ normalized rows (experiments,
// daily_actions, confidence_sources).
// ============================================================

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { IExperimentRepository } from "@/domains/experimentation/ports";
import type {
  Experiment,
  ExperimentStatus,
  DailyAction,
  DailyActionStatus,
  ConfidenceSourceType,
} from "@/types/experiment";

const include = { dailyActions: true, confidenceSources: true } as const;

type ExperimentRow = Prisma.ExperimentGetPayload<{ include: typeof include }>;
type DailyRow = ExperimentRow["dailyActions"][number];

// --- Mapping: DTO → row scalars ---

function toScalars(e: Experiment) {
  return {
    keyResultId: e.keyResultId,
    okrId: e.okrId,
    actionId: e.actionId ?? null,
    title: e.title,
    channel: e.channel,
    audienceSegment: e.audienceSegment ?? null,
    hypothesisBelief: e.hypothesis.belief,
    hypothesisAudience: e.hypothesis.audience,
    hypothesisOutcome: e.hypothesis.outcome,
    hypothesisSuccessMetric: e.hypothesis.successMetric,
    hypothesisThreshold: e.hypothesis.threshold,
    iceImpact: e.ice.impact,
    iceConfidence: e.ice.confidence,
    iceEase: e.ice.ease,
    weekOf: e.weekOf ?? null,
    status: e.status,
    resultMeasuredValue: e.result?.measuredValue ?? null,
    resultMetThreshold: e.result?.metThreshold ?? null,
    resultMeasuredAt: e.result?.measuredAt ?? null,
    learning: e.learning ?? null,
    companyName: e.companyName,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

// --- Mapping: row → DTO ---

function toDailyDto(d: DailyRow): DailyAction {
  return {
    id: d.id,
    experimentId: d.experimentId,
    scheduledDate: d.scheduledDate,
    channel: d.channel,
    title: d.title,
    asset:
      d.assetContent !== null
        ? {
            format: d.assetFormat ?? "",
            variantLabel: d.assetVariantLabel ?? undefined,
            content: d.assetContent,
          }
        : null,
    status: d.status as DailyActionStatus,
    carryOverFrom: d.carryOverFrom ?? undefined,
  };
}

function toDto(row: ExperimentRow): Experiment {
  return {
    id: row.id,
    keyResultId: row.keyResultId,
    okrId: row.okrId,
    actionId: row.actionId ?? undefined,
    title: row.title,
    channel: row.channel,
    audienceSegment: row.audienceSegment ?? undefined,
    hypothesis: {
      belief: row.hypothesisBelief,
      audience: row.hypothesisAudience,
      outcome: row.hypothesisOutcome,
      successMetric: row.hypothesisSuccessMetric,
      threshold: row.hypothesisThreshold,
    },
    ice: {
      impact: row.iceImpact,
      confidence: row.iceConfidence,
      ease: row.iceEase,
    },
    confidenceSources: row.confidenceSources.map((s) => ({
      type: s.type as ConfidenceSourceType,
      evidence: s.evidence,
    })),
    weekOf: row.weekOf ?? undefined,
    dailyActions: row.dailyActions.map(toDailyDto),
    status: row.status as ExperimentStatus,
    result:
      row.resultMeasuredValue !== null && row.resultMeasuredAt !== null
        ? {
            measuredValue: row.resultMeasuredValue,
            metThreshold: row.resultMetThreshold ?? false,
            measuredAt: row.resultMeasuredAt,
          }
        : undefined,
    learning: row.learning ?? undefined,
    companyName: row.companyName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaExperimentRepository implements IExperimentRepository {
  async save(e: Experiment): Promise<string> {
    const scalars = toScalars(e);

    await prisma.$transaction(async (tx) => {
      await tx.experiment.upsert({
        where: { id: e.id },
        create: { id: e.id, ...scalars },
        update: scalars,
      });

      // Replace child collections (idempotent upsert of the whole aggregate).
      await tx.dailyAction.deleteMany({ where: { experimentId: e.id } });
      await tx.confidenceSource.deleteMany({ where: { experimentId: e.id } });

      if (e.dailyActions.length > 0) {
        await tx.dailyAction.createMany({
          data: e.dailyActions.map((d) => ({
            id: d.id,
            experimentId: e.id,
            scheduledDate: d.scheduledDate,
            channel: d.channel,
            title: d.title,
            status: d.status,
            carryOverFrom: d.carryOverFrom ?? null,
            assetFormat: d.asset?.format ?? null,
            assetVariantLabel: d.asset?.variantLabel ?? null,
            assetContent: d.asset?.content ?? null,
          })),
        });
      }

      if (e.confidenceSources.length > 0) {
        await tx.confidenceSource.createMany({
          data: e.confidenceSources.map((s) => ({
            experimentId: e.id,
            type: s.type,
            evidence: s.evidence,
          })),
        });
      }
    });

    return e.id;
  }

  async get(experimentId: string): Promise<Experiment | null> {
    const row = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include,
    });
    return row ? toDto(row) : null;
  }

  async list(): Promise<Experiment[]> {
    const rows = await prisma.experiment.findMany({ include });
    return rows.map(toDto);
  }

  async listByKeyResult(keyResultId: string): Promise<Experiment[]> {
    const rows = await prisma.experiment.findMany({ where: { keyResultId }, include });
    return rows.map(toDto);
  }

  async listByWeek(weekOf: string): Promise<Experiment[]> {
    const rows = await prisma.experiment.findMany({ where: { weekOf }, include });
    return rows.map(toDto);
  }

  async reset(): Promise<void> {
    // Cascade removes daily_actions + confidence_sources.
    await prisma.experiment.deleteMany({});
  }
}

export const experimentRepository = new PrismaExperimentRepository();
