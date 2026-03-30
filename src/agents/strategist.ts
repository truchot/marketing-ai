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
    "strategic",
    "tactical",
    "operational",
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

    // ========== STRATEGIC LAYER ==========
    strategic: {
      type: "object",
      required: ["diagnostic", "positioning", "okrs", "prioritySegments"],
      properties: {
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
        positioning: {
          type: "object",
          required: ["targetMarket", "uniqueValue", "competitiveAngle", "brandPersonality"],
          properties: {
            targetMarket: { type: "string" },
            uniqueValue: { type: "string" },
            competitiveAngle: { type: "string" },
            brandPersonality: { type: "string" },
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
        prioritySegments: {
          type: "array",
          items: {
            type: "object",
            required: ["segment", "priority", "mainPain", "targetMessage"],
            properties: {
              segment: { type: "string" },
              priority: { type: "string", enum: ["primary", "secondary"] },
              mainPain: { type: "string" },
              targetMessage: { type: "string" },
            },
          },
        },
      },
    },

    // ========== TACTICAL LAYER ==========
    tactical: {
      type: "object",
      required: ["campaigns", "channelStrategy", "contentPlan", "budgetAllocation"],
      properties: {
        campaigns: {
          type: "array",
          items: {
            type: "object",
            required: [
              "id",
              "okrId",
              "name",
              "objective",
              "targetSegment",
              "channels",
              "contentThemes",
              "keyMessages",
              "duration",
              "successMetric",
            ],
            properties: {
              id: { type: "string" },
              okrId: { type: "string" },
              name: { type: "string" },
              objective: { type: "string" },
              targetSegment: { type: "string" },
              channels: { type: "array", items: { type: "string" } },
              contentThemes: { type: "array", items: { type: "string" } },
              keyMessages: { type: "array", items: { type: "string" } },
              duration: { type: "string" },
              successMetric: { type: "string" },
            },
          },
        },
        channelStrategy: {
          type: "array",
          items: {
            type: "object",
            required: [
              "channel",
              "role",
              "targetSegments",
              "frequency",
              "contentTypes",
              "estimatedBudget",
            ],
            properties: {
              channel: { type: "string" },
              role: {
                type: "string",
                enum: ["acquisition", "nurturing", "retention", "brand"],
              },
              targetSegments: { type: "array", items: { type: "string" } },
              frequency: { type: "string" },
              contentTypes: { type: "array", items: { type: "string" } },
              estimatedBudget: { type: "string" },
            },
          },
        },
        contentPlan: {
          type: "array",
          items: {
            type: "object",
            required: ["pillar", "themes", "formats", "cadence", "targetSegment"],
            properties: {
              pillar: { type: "string" },
              themes: { type: "array", items: { type: "string" } },
              formats: { type: "array", items: { type: "string" } },
              cadence: { type: "string" },
              targetSegment: { type: "string" },
            },
          },
        },
        budgetAllocation: {
          type: "array",
          items: {
            type: "object",
            required: ["channel", "monthlyBudget", "percentage", "justification"],
            properties: {
              channel: { type: "string" },
              monthlyBudget: { type: "string" },
              percentage: { type: "number" },
              justification: { type: "string" },
            },
          },
        },
      },
    },

    // ========== OPERATIONAL LAYER ==========
    operational: {
      type: "object",
      required: ["tasks", "calendar", "weeklyKPIs"],
      properties: {
        tasks: {
          type: "array",
          items: {
            type: "object",
            required: [
              "id",
              "campaignId",
              "title",
              "description",
              "owner",
              "deadline",
              "priority",
              "status",
              "estimatedHours",
              "dependencies",
              "deliverable",
            ],
            properties: {
              id: { type: "string" },
              campaignId: { type: "string" },
              title: { type: "string" },
              description: { type: "string" },
              owner: { type: "string" },
              deadline: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              status: { type: "string", enum: ["todo", "in_progress", "done"] },
              estimatedHours: { type: "number" },
              dependencies: { type: "array", items: { type: "string" } },
              deliverable: { type: "string" },
            },
          },
        },
        calendar: {
          type: "array",
          items: {
            type: "object",
            required: ["week", "tasks"],
            properties: {
              week: { type: "string" },
              tasks: {
                type: "array",
                items: {
                  type: "object",
                  required: ["taskId", "channel", "contentType", "topic"],
                  properties: {
                    taskId: { type: "string" },
                    channel: { type: "string" },
                    contentType: { type: "string" },
                    topic: { type: "string" },
                  },
                },
              },
            },
          },
        },
        weeklyKPIs: {
          type: "array",
          items: {
            type: "object",
            required: ["metric", "targetPerWeek", "trackingTool"],
            properties: {
              metric: { type: "string" },
              targetPerWeek: { type: "string" },
              trackingTool: { type: "string" },
            },
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
    "strategic" in data &&
    "tactical" in data &&
    "operational" in data &&
    "narrativeSummary" in data
  );
}
