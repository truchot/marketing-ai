// JSON Schema for StrategicLayer — mirrors types in src/types/marketing-strategy.ts

const PROBLEM_KEYS = [
  "outdated_tactics", "unclear_messaging", "undefined_audience", "weak_product",
  "poor_measurement", "wrong_talents", "standard_positioning", "painless_problem",
  "insufficient_content", "imperfect_pricing", "inconsistent_efforts", "guesswork",
  "bad_creative", "poor_systems", "rough_sales", "no_innovation",
];

const problemAssessmentSchema = {
  type: "object",
  required: [
    "key", "label", "severity", "isStrategic",
    "evidence", "recommendation", "confidence", "dataSufficiency",
  ],
  properties: {
    key: { type: "string", enum: PROBLEM_KEYS },
    label: { type: "string" },
    severity: { type: "string", enum: ["easily_fixed", "normal", "problematic", "deep", "critical"] },
    isStrategic: { type: "boolean" },
    evidence: { type: "string" },
    recommendation: { type: "string" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    dataSufficiency: { type: "string", enum: ["measured", "inferred", "insufficient"] },
  },
};

const diagnosticSchema = {
  type: "object",
  required: ["maturityScore", "strengths", "weaknesses", "opportunities", "threats", "summary"],
  properties: {
    maturityScore: { type: "number", minimum: 0, maximum: 100 },
    // problems/criticalProblems are produced deterministically by generateDiagnostic
    // (the 16-problem grid) — permitted here but intentionally not required, so the
    // structured-output agent is not forced to hand-author them.
    problems: { type: "array", items: problemAssessmentSchema },
    criticalProblems: { type: "array", items: { type: "string", enum: PROBLEM_KEYS } },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    opportunities: { type: "array", items: { type: "string" } },
    threats: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
  },
};

const targetMarketSchema = {
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
        "description", "painPoints", "triggerMoments", "buyingContext",
        "preferredChannels", "commonObjections", "decisionCriteria",
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
};

const businessStrategySchema = {
  type: "object",
  required: [
    "vision", "valueProposition", "transformation",
    "uniqueDifferentiator", "competitiveAngle", "businessStage",
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
};

const feedbackLoopSchema = {
  type: "object",
  required: ["hypotheses", "validationTests", "reviewCadence", "pivotTriggers"],
  properties: {
    hypotheses: { type: "array", items: { type: "string" } },
    validationTests: {
      type: "array",
      items: {
        type: "object",
        required: [
          "hypothesis", "metric", "method", "successCriteria",
          "timeline", "status", "linkedKpiIds",
        ],
        properties: {
          hypothesis: { type: "string" },
          metric: { type: "string" },
          method: { type: "string" },
          successCriteria: { type: "string" },
          timeline: { type: "string" },
          status: {
            type: "string",
            enum: ["untested", "validated", "invalidated", "needs_more_data"],
          },
          linkedKpiIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    reviewCadence: { type: "string" },
    pivotTriggers: { type: "array", items: { type: "string" } },
  },
};

const marketingFoundationSchema = {
  type: "object",
  required: ["offer", "positioning", "messaging"],
  properties: {
    offer: { type: "string" },
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
};

const okrSchema = {
  type: "array",
  items: {
    type: "object",
    required: ["id", "objective", "rationale", "keyResults", "priority", "linkedDiscoveryData"],
    properties: {
      id: { type: "string" },
      objective: { type: "string" },
      rationale: { type: "string" },
      keyResults: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "metric", "current", "target", "timeline", "confidence"],
          properties: {
            id: { type: "string" },
            metric: { type: "string" },
            current: { type: ["string", "null"] },
            target: { type: "string" },
            timeline: { type: "string" },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
          },
        },
      },
      priority: { type: "string", enum: ["primary", "secondary"] },
      linkedDiscoveryData: {
        type: "object",
        required: ["fromBlock", "evidence"],
        properties: {
          fromBlock: {
            type: "string",
            enum: ["problem_value", "audience", "marketing_landscape", "business_context"],
          },
          evidence: { type: "string" },
        },
      },
    },
  },
};

const roadmapValidationSchema = {
  type: "object",
  required: ["strategySummary", "readinessScore", "gaps", "recommendation"],
  properties: {
    strategySummary: {
      type: "object",
      required: ["whoWeHelp", "whatProblem", "howWeDiffer", "whatWeSay"],
      properties: {
        whoWeHelp: { type: "string" },
        whatProblem: { type: "string" },
        howWeDiffer: { type: "string" },
        whatWeSay: { type: "string" },
      },
    },
    readinessScore: { type: "number", minimum: 0, maximum: 100 },
    gaps: { type: "array", items: { type: "string" } },
    recommendation: { type: "string", enum: ["proceed", "refine", "rethink"] },
  },
};

export const strategicLayerSchema = {
  type: "object",
  required: [
    "diagnostic", "targetMarket", "businessStrategy", "feedbackLoop",
    "marketingFoundation", "okrs", "timeHorizon", "roadmapValidation",
  ],
  properties: {
    diagnostic: diagnosticSchema,
    targetMarket: targetMarketSchema,
    businessStrategy: businessStrategySchema,
    feedbackLoop: feedbackLoopSchema,
    marketingFoundation: marketingFoundationSchema,
    okrs: okrSchema,
    timeHorizon: { type: "string" },
    roadmapValidation: roadmapValidationSchema,
  },
};
