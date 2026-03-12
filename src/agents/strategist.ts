import { readFileSync } from "fs";
import { join } from "path";
import type { MarketingStrategy } from "@/types/marketing-strategy";

// Load system prompt from .claude/agents/strategist.md
const PROMPT_PATH = join(process.cwd(), ".claude/agents/strategist.md");

export function getStrategistSystemPrompt(): string {
  return readFileSync(PROMPT_PATH, "utf-8");
}

// JSON Schema for structured output (derived from MarketingStrategy TypeScript interface)
export const marketingStrategySchema: Record<string, unknown> = {
  type: "object",
  required: [
    "metadata",
    "diagnostic",
    "okrs",
    "actions",
    "executionRoadmap",
    "constraints",
    "narrativeSummary",
  ],
  properties: {
    metadata: {
      type: "object",
      required: [
        "companyName",
        "generatedAt",
        "discoveryCompletionStatus",
        "strategyVersion",
      ],
      properties: {
        companyName: { type: "string" },
        generatedAt: { type: "string" },
        discoveryCompletionStatus: {
          type: "string",
          enum: ["complete", "partial"],
        },
        strategyVersion: { type: "number" },
      },
    },
    diagnostic: {
      type: "object",
      required: [
        "maturityScore",
        "strengths",
        "weaknesses",
        "opportunities",
        "threats",
        "summary",
      ],
      properties: {
        maturityScore: { type: "number", minimum: 0, maximum: 100 },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        opportunities: { type: "array", items: { type: "string" } },
        threats: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
      },
    },
    okrs: {
      type: "array",
      items: {
        type: "object",
        required: [
          "id",
          "objective",
          "rationale",
          "keyResults",
          "priority",
          "linkedDiscoveryData",
        ],
        properties: {
          id: { type: "string" },
          objective: { type: "string" },
          rationale: { type: "string" },
          keyResults: {
            type: "array",
            items: {
              type: "object",
              required: [
                "id",
                "metric",
                "current",
                "target",
                "timeline",
                "confidence",
              ],
              properties: {
                id: { type: "string" },
                metric: { type: "string" },
                current: { type: ["string", "null"] },
                target: { type: "string" },
                timeline: { type: "string" },
                confidence: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                },
              },
            },
          },
          priority: {
            type: "string",
            enum: ["primary", "secondary"],
          },
          linkedDiscoveryData: {
            type: "object",
            required: ["fromBlock", "evidence"],
            properties: {
              fromBlock: {
                type: "string",
                enum: [
                  "problem_value",
                  "audience",
                  "marketing_landscape",
                  "business_context",
                ],
              },
              evidence: { type: "string" },
            },
          },
        },
      },
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        required: [
          "id",
          "okrId",
          "keyResultId",
          "title",
          "description",
          "type",
          "effort",
          "impact",
          "requiredSkills",
          "requiredTools",
          "dependencies",
          "suggestedTimeline",
        ],
        properties: {
          id: { type: "string" },
          okrId: { type: "string" },
          keyResultId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          type: {
            type: "string",
            enum: ["quick_win", "strategic", "foundation"],
          },
          effort: { type: "string", enum: ["low", "medium", "high"] },
          impact: { type: "string", enum: ["low", "medium", "high"] },
          requiredSkills: { type: "array", items: { type: "string" } },
          requiredTools: { type: "array", items: { type: "string" } },
          dependencies: { type: "array", items: { type: "string" } },
          suggestedTimeline: { type: "string" },
          channel: { type: "string" },
          audienceSegment: { type: "string" },
        },
      },
    },
    executionRoadmap: {
      type: "object",
      required: ["phase1", "phase2", "phase3"],
      properties: {
        phase1: {
          type: "object",
          required: ["name", "duration", "actionIds"],
          properties: {
            name: { type: "string" },
            duration: { type: "string" },
            actionIds: { type: "array", items: { type: "string" } },
          },
        },
        phase2: {
          type: "object",
          required: ["name", "duration", "actionIds"],
          properties: {
            name: { type: "string" },
            duration: { type: "string" },
            actionIds: { type: "array", items: { type: "string" } },
          },
        },
        phase3: {
          type: "object",
          required: ["name", "duration", "actionIds"],
          properties: {
            name: { type: "string" },
            duration: { type: "string" },
            actionIds: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    constraints: {
      type: "object",
      required: ["budgetFit", "teamFit", "adaptations"],
      properties: {
        budgetFit: { type: "boolean" },
        teamFit: { type: "boolean" },
        adaptations: { type: "array", items: { type: "string" } },
      },
    },
    narrativeSummary: { type: "string" },
  },
};

// Type guard for the structured output
export function isMarketingStrategy(
  data: unknown
): data is MarketingStrategy {
  return (
    typeof data === "object" &&
    data !== null &&
    "metadata" in data &&
    "diagnostic" in data &&
    "okrs" in data &&
    "actions" in data &&
    "narrativeSummary" in data
  );
}
