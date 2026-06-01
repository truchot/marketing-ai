import { readFileSync } from "fs";
import { join } from "path";
import type { Hypothesis, IceScore, ConfidenceSource } from "@/types/experiment";

// Load system prompt from .claude/agents/growth-strategist.md
const PROMPT_PATH = join(process.cwd(), ".claude/agents/growth-strategist.md");

export function getGrowthStrategistSystemPrompt(): string {
  return readFileSync(PROMPT_PATH, "utf-8");
}

// ============================================================
// Structured-output contract: the weekly experiment backlog
// ============================================================
// Each candidate maps to a CreateExperimentInput (raw) the
// GenerateBacklogUseCase can consume. companyName is injected
// by the caller, not produced by the agent.

export interface ExperimentBacklogCandidate {
  keyResultId: string;
  okrId: string;
  actionId?: string;
  title: string;
  channel: string;
  audienceSegment?: string;
  hypothesis: Hypothesis;
  ice: IceScore;
  confidenceSources: ConfidenceSource[];
}

export interface ExperimentBacklog {
  candidates: ExperimentBacklogCandidate[];
}

const CONFIDENCE_SOURCE_TYPES = [
  "sector_benchmark",
  "competitor_intel",
  "first_party_result",
  "own_analytics",
  "semantic_memory",
] as const;

// JSON Schema for structured output (derived from the interfaces above)
export const experimentBacklogSchema: Record<string, unknown> = {
  type: "object",
  required: ["candidates"],
  properties: {
    candidates: {
      type: "array",
      items: {
        type: "object",
        required: [
          "keyResultId",
          "okrId",
          "title",
          "channel",
          "hypothesis",
          "ice",
          "confidenceSources",
        ],
        properties: {
          keyResultId: { type: "string" },
          okrId: { type: "string" },
          actionId: { type: "string" },
          title: { type: "string" },
          channel: { type: "string" },
          audienceSegment: { type: "string" },
          hypothesis: {
            type: "object",
            required: ["belief", "audience", "outcome", "successMetric", "threshold"],
            properties: {
              belief: { type: "string" },
              audience: { type: "string" },
              outcome: { type: "string" },
              successMetric: { type: "string" },
              threshold: { type: "string" },
            },
          },
          ice: {
            type: "object",
            required: ["impact", "confidence", "ease"],
            properties: {
              impact: { type: "number", minimum: 1, maximum: 10 },
              confidence: { type: "number", minimum: 1, maximum: 10 },
              ease: { type: "number", minimum: 1, maximum: 10 },
            },
          },
          confidenceSources: {
            type: "array",
            items: {
              type: "object",
              required: ["type", "evidence"],
              properties: {
                type: { type: "string", enum: [...CONFIDENCE_SOURCE_TYPES] },
                evidence: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

// Type guard for the structured output
export function isExperimentBacklog(data: unknown): data is ExperimentBacklog {
  if (typeof data !== "object" || data === null || !("candidates" in data)) {
    return false;
  }
  const candidates = (data as { candidates: unknown }).candidates;
  return Array.isArray(candidates);
}
