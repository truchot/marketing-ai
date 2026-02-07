import { readFileSync } from "fs";
import { join } from "path";
import type { BusinessDiscovery } from "@/types/business-discovery";

// Load system prompt from .claude/agents/business-discovery.md
const PROMPT_PATH = join(
  process.cwd(),
  ".claude/agents/business-discovery.md"
);

export function getDiscoverySystemPrompt(): string {
  return readFileSync(PROMPT_PATH, "utf-8");
}

// JSON Schema for structured output (derived from BusinessDiscovery TypeScript interface)
export const businessDiscoverySchema: Record<string, unknown> = {
  type: "object",
  required: [
    "metadata",
    "problem",
    "valueProposition",
    "audiences",
    "currentMarketing",
    "businessContext",
    "narrativeSummary",
    "strategicHypotheses",
  ],
  properties: {
    metadata: {
      type: "object",
      required: [
        "companyName",
        "interviewDate",
        "intervieweeName",
        "intervieweeRole",
        "sector",
        "completionStatus",
        "gaps",
      ],
      properties: {
        companyName: { type: "string" },
        interviewDate: { type: "string" },
        intervieweeName: { type: "string" },
        intervieweeRole: { type: "string" },
        sector: {
          type: "string",
          enum: ["saas", "ecommerce", "agency", "startup", "other"],
        },
        completionStatus: {
          type: "string",
          enum: ["complete", "partial"],
        },
        gaps: { type: "array", items: { type: "string" } },
      },
    },
    problem: {
      type: "object",
      required: [
        "statement",
        "painLevel",
        "frequency",
        "currentAlternatives",
      ],
      properties: {
        statement: { type: "string" },
        painLevel: {
          type: "string",
          enum: ["irritant", "bloquant", "critique"],
        },
        frequency: { type: "string" },
        currentAlternatives: {
          type: "array",
          items: {
            type: "object",
            required: ["alternative", "limitations"],
            properties: {
              alternative: { type: "string" },
              limitations: { type: "string" },
            },
          },
        },
      },
    },
    valueProposition: {
      type: "object",
      required: ["transformation", "uniqueDifferentiator", "proofPoints"],
      properties: {
        transformation: {
          type: "object",
          required: ["before", "after", "timeToValue"],
          properties: {
            before: { type: "string" },
            after: { type: "string" },
            timeToValue: { type: "string" },
          },
        },
        uniqueDifferentiator: { type: "string" },
        proofPoints: {
          type: "array",
          items: {
            type: "object",
            required: ["type", "description", "verified"],
            properties: {
              type: {
                type: "string",
                enum: [
                  "testimonial",
                  "case_study",
                  "metric",
                  "award",
                  "other",
                ],
              },
              description: { type: "string" },
              verified: { type: "boolean" },
            },
          },
        },
      },
    },
    audiences: {
      type: "array",
      items: {
        type: "object",
        required: [
          "segment",
          "priority",
          "painIntensity",
          "triggerMoment",
          "buyingContext",
          "language",
          "channels",
          "objections",
        ],
        properties: {
          segment: { type: "string" },
          priority: {
            type: "string",
            enum: ["primary", "secondary", "exploratory"],
          },
          painIntensity: { type: "string" },
          triggerMoment: { type: "string" },
          buyingContext: { type: "string" },
          language: { type: "array", items: { type: "string" } },
          channels: { type: "array", items: { type: "string" } },
          objections: {
            type: "array",
            items: {
              type: "object",
              required: ["objection", "currentAnswer"],
              properties: {
                objection: { type: "string" },
                currentAnswer: { type: ["string", "null"] },
              },
            },
          },
          decisionProcess: {
            type: "object",
            properties: {
              decisionMakers: { type: "array", items: { type: "string" } },
              influencers: { type: "array", items: { type: "string" } },
              averageCycleLength: { type: "string" },
              typicalBudget: { type: "string" },
            },
          },
        },
      },
    },
    currentMarketing: {
      type: "object",
      required: [
        "channels",
        "abandonedChannels",
        "bestPerforming",
        "biggestGap",
        "team",
        "budget",
        "tools",
      ],
      properties: {
        channels: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "type", "frequency", "perceivedResults", "notes"],
            properties: {
              name: { type: "string" },
              type: {
                type: "string",
                enum: ["organic", "paid", "referral", "partnership", "offline"],
              },
              frequency: { type: "string" },
              perceivedResults: {
                type: "string",
                enum: ["good", "average", "poor", "unknown"],
              },
              notes: { type: "string" },
            },
          },
        },
        abandonedChannels: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "reason"],
            properties: {
              name: { type: "string" },
              reason: { type: "string" },
            },
          },
        },
        bestPerforming: { type: ["string", "null"] },
        biggestGap: { type: ["string", "null"] },
        team: {
          type: "object",
          required: ["size", "dedicatedToMarketing", "skills", "gaps"],
          properties: {
            size: { type: "number" },
            dedicatedToMarketing: { type: "boolean" },
            skills: { type: "array", items: { type: "string" } },
            gaps: { type: "array", items: { type: "string" } },
          },
        },
        budget: {
          type: "object",
          required: ["range", "allocation", "flexibility"],
          properties: {
            range: { type: "string" },
            allocation: { type: "string" },
            flexibility: {
              type: "string",
              enum: ["fixed", "adjustable", "undefined"],
            },
          },
        },
        tools: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "category", "maturity"],
            properties: {
              name: { type: "string" },
              category: {
                type: "string",
                enum: [
                  "crm",
                  "email",
                  "social",
                  "analytics",
                  "automation",
                  "content",
                  "other",
                ],
              },
              maturity: {
                type: "string",
                enum: ["well_configured", "underused", "inactive"],
              },
            },
          },
        },
      },
    },
    businessContext: {
      type: "object",
      required: [
        "stage",
        "stageDetails",
        "primaryGoal",
        "constraints",
        "upcomingEvents",
        "urgency",
      ],
      properties: {
        stage: {
          type: "string",
          enum: ["launch", "growth", "consolidation", "scale", "pivot"],
        },
        stageDetails: { type: "string" },
        primaryGoal: {
          type: "object",
          required: ["description", "metric", "timeline"],
          properties: {
            description: { type: "string" },
            metric: { type: ["string", "null"] },
            timeline: { type: "string" },
          },
        },
        constraints: {
          type: "array",
          items: {
            type: "object",
            required: ["type", "description", "severity"],
            properties: {
              type: {
                type: "string",
                enum: [
                  "budget",
                  "time",
                  "skills",
                  "seasonality",
                  "dependency",
                  "other",
                ],
              },
              description: { type: "string" },
              severity: { type: "string", enum: ["hard", "soft"] },
            },
          },
        },
        upcomingEvents: {
          type: "array",
          items: {
            type: "object",
            required: ["event", "date", "impact"],
            properties: {
              event: { type: "string" },
              date: { type: "string" },
              impact: { type: "string" },
            },
          },
        },
        urgency: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
        },
      },
    },
    narrativeSummary: { type: "string" },
    strategicHypotheses: {
      type: "array",
      items: { type: "string" },
    },
  },
};

// Type guard for the structured output
export function isBusinessDiscovery(
  data: unknown
): data is BusinessDiscovery {
  return (
    typeof data === "object" &&
    data !== null &&
    "metadata" in data &&
    "problem" in data &&
    "narrativeSummary" in data
  );
}
