// JSON Schema for TacticalLayer — mirrors types in src/types/marketing-strategy.ts

const marketingPlanSchema = {
  type: "object",
  required: ["campaigns", "channelStrategy", "contentPlan", "budgetAllocation", "kpis", "roadmap", "reviewCycle"],
  properties: {
    campaigns: {
      type: "array",
      items: {
        type: "object",
        required: [
          "id", "okrId", "name", "objective", "targetSegment", "funnelStage",
          "channels", "contentThemes", "keyMessages", "duration", "successMetric",
        ],
        properties: {
          id: { type: "string" },
          okrId: { type: "string" },
          name: { type: "string" },
          objective: { type: "string" },
          targetSegment: { type: "string" },
          funnelStage: {
            type: "string",
            enum: ["awareness", "consideration", "conversion", "retention"],
          },
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
        required: ["channel", "role", "funnelStages", "targetSegments", "frequency", "contentTypes", "estimatedBudget"],
        properties: {
          channel: { type: "string" },
          role: { type: "string", enum: ["acquisition", "nurturing", "retention", "brand"] },
          funnelStages: {
            type: "array",
            items: {
              type: "string",
              enum: ["awareness", "consideration", "conversion", "retention"],
            },
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
    reviewCycle: { type: "string" },
  },
};

const marketingSystemSchema = {
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
};

export const tacticalLayerSchema = {
  type: "object",
  required: ["marketingPlan", "marketingSystem"],
  properties: {
    marketingPlan: marketingPlanSchema,
    marketingSystem: marketingSystemSchema,
  },
};
