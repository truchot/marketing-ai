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
      required: [
        "diagnostic",
        "targetMarket",
        "businessStrategy",
        "feedbackLoop",
        "marketingFoundation",
        "okrs",
      ],
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

        // --- Subsystem 1: Target Market ---
        targetMarket: {
          type: "object",
          required: ["marketDefinition", "segments", "icp"],
          properties: {
            marketDefinition: { type: "string" },
            segments: {
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
            icp: {
              type: "object",
              required: [
                "description",
                "painPoints",
                "triggerMoments",
                "buyingContext",
                "preferredChannels",
                "commonObjections",
                "decisionCriteria",
              ],
              properties: {
                description: { type: "string" },
                painPoints: { type: "array", items: { type: "string" } },
                triggerMoments: { type: "array", items: { type: "string" } },
                buyingContext: { type: "string" },
                preferredChannels: { type: "array", items: { type: "string" } },
                commonObjections: { type: "array", items: { type: "string" } },
                decisionCriteria: { type: "array", items: { type: "string" } },
              },
            },
          },
        },

        // --- Subsystem 2: Business Strategy ---
        businessStrategy: {
          type: "object",
          required: [
            "vision",
            "valueProposition",
            "transformation",
            "uniqueDifferentiator",
            "competitiveAngle",
            "businessStage",
          ],
          properties: {
            vision: { type: "string" },
            valueProposition: { type: "string" },
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
            competitiveAngle: { type: "string" },
            businessStage: { type: "string" },
          },
        },

        // --- Subsystem 3: Feedback Loop ---
        feedbackLoop: {
          type: "object",
          required: [
            "hypotheses",
            "validationTests",
            "reviewCadence",
            "pivotTriggers",
          ],
          properties: {
            hypotheses: { type: "array", items: { type: "string" } },
            validationTests: {
              type: "array",
              items: {
                type: "object",
                required: [
                  "hypothesis",
                  "metric",
                  "method",
                  "successCriteria",
                  "timeline",
                ],
                properties: {
                  hypothesis: { type: "string" },
                  metric: { type: "string" },
                  method: { type: "string" },
                  successCriteria: { type: "string" },
                  timeline: { type: "string" },
                },
              },
            },
            reviewCadence: { type: "string" },
            pivotTriggers: { type: "array", items: { type: "string" } },
          },
        },

        // --- Subsystem 4: Marketing Foundation ---
        marketingFoundation: {
          type: "object",
          required: ["offer", "positioning", "messaging"],
          properties: {
            offer: { type: "string" },
            positioning: {
              type: "object",
              required: [
                "targetMarket",
                "uniqueValue",
                "competitiveAngle",
                "brandPersonality",
              ],
              properties: {
                targetMarket: { type: "string" },
                uniqueValue: { type: "string" },
                competitiveAngle: { type: "string" },
                brandPersonality: { type: "string" },
              },
            },
            messaging: {
              type: "object",
              required: ["primaryMessage", "segmentMessages", "proofPoints"],
              properties: {
                primaryMessage: { type: "string" },
                segmentMessages: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["segment", "message", "tone"],
                    properties: {
                      segment: { type: "string" },
                      message: { type: "string" },
                      tone: { type: "string" },
                    },
                  },
                },
                proofPoints: { type: "array", items: { type: "string" } },
              },
            },
          },
        },

        // --- OKRs (cross-cutting) ---
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
      },
    },

    // ========== TACTICAL LAYER (2 subsystems) ==========
    tactical: {
      type: "object",
      required: ["marketingPlan", "marketingSystem"],
      properties: {
        // --- Subsystem 5: Marketing Plan ---
        marketingPlan: {
          type: "object",
          required: ["campaigns", "channelStrategy", "contentPlan", "budgetAllocation", "kpis", "roadmap"],
          properties: {
            campaigns: {
              type: "array",
              items: {
                type: "object",
                required: ["id", "okrId", "name", "objective", "targetSegment", "channels", "contentThemes", "keyMessages", "duration", "successMetric"],
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
                required: ["channel", "role", "targetSegments", "frequency", "contentTypes", "estimatedBudget"],
                properties: {
                  channel: { type: "string" },
                  role: { type: "string", enum: ["acquisition", "nurturing", "retention", "brand"] },
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
            kpis: {
              type: "array",
              items: {
                type: "object",
                required: ["id", "campaignId", "metric", "baseline", "target", "trackingMethod"],
                properties: {
                  id: { type: "string" },
                  campaignId: { type: "string" },
                  metric: { type: "string" },
                  baseline: { type: ["string", "null"] },
                  target: { type: "string" },
                  trackingMethod: { type: "string" },
                },
              },
            },
            roadmap: {
              type: "array",
              items: {
                type: "object",
                required: ["phase", "startWeek", "endWeek", "focus", "campaigns", "milestones"],
                properties: {
                  phase: { type: "string" },
                  startWeek: { type: "string" },
                  endWeek: { type: "string" },
                  focus: { type: "string" },
                  campaigns: { type: "array", items: { type: "string" } },
                  milestones: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        // --- Subsystem 6: Marketing System ---
        marketingSystem: {
          type: "object",
          required: ["backlog", "processes", "automations", "systemArchitecture"],
          properties: {
            backlog: {
              type: "array",
              items: {
                type: "object",
                required: ["id", "title", "type", "description", "priority", "status", "estimatedEffort", "linkedCampaignIds"],
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  type: { type: "string", enum: ["tool_setup", "template", "automation", "process", "integration"] },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  status: { type: "string", enum: ["todo", "in_progress", "done"] },
                  estimatedEffort: { type: "string" },
                  linkedCampaignIds: { type: "array", items: { type: "string" } },
                },
              },
            },
            processes: {
              type: "array",
              items: {
                type: "object",
                required: ["id", "name", "description", "steps", "frequency", "owner", "tools"],
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  description: { type: "string" },
                  steps: { type: "array", items: { type: "string" } },
                  frequency: { type: "string" },
                  owner: { type: "string" },
                  tools: { type: "array", items: { type: "string" } },
                },
              },
            },
            automations: {
              type: "array",
              items: {
                type: "object",
                required: ["id", "name", "trigger", "action", "tool", "linkedProcessId"],
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  trigger: { type: "string" },
                  action: { type: "string" },
                  tool: { type: "string" },
                  linkedProcessId: { type: "string" },
                },
              },
            },
            systemArchitecture: {
              type: "object",
              required: ["tools", "dataFlows"],
              properties: {
                tools: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["name", "role", "category", "integrations", "configurationNeeded"],
                    properties: {
                      name: { type: "string" },
                      role: { type: "string" },
                      category: { type: "string" },
                      integrations: { type: "array", items: { type: "string" } },
                      configurationNeeded: { type: "string" },
                    },
                  },
                },
                dataFlows: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["from", "to", "data"],
                    properties: {
                      from: { type: "string" },
                      to: { type: "string" },
                      data: { type: "string" },
                    },
                  },
                },
              },
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
  if (
    typeof data !== "object" ||
    data === null ||
    !("metadata" in data) ||
    !("strategic" in data) ||
    !("tactical" in data) ||
    !("operational" in data) ||
    !("narrativeSummary" in data)
  ) {
    return false;
  }
  const strategic = (data as Record<string, unknown>).strategic;
  const tactical = (data as Record<string, unknown>).tactical;
  return (
    typeof strategic === "object" &&
    strategic !== null &&
    "targetMarket" in strategic &&
    "businessStrategy" in strategic &&
    "feedbackLoop" in strategic &&
    "marketingFoundation" in strategic &&
    typeof tactical === "object" &&
    tactical !== null &&
    "marketingPlan" in tactical &&
    "marketingSystem" in tactical
  );
}
