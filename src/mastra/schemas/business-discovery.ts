// ============================================================
// Miroir Zod de businessDiscoverySchema (src/agents/discovery.ts).
// Utilisé par Mastra structuredOutput pour l'extraction structurée.
// Traduction 1:1 du JSON Schema (enums identiques, null -> .nullable(),
// decisionProcess -> .optional()).
// ============================================================

import { z } from "zod";

const proofPoint = z.object({
  type: z.enum(["testimonial", "case_study", "metric", "award", "other"]),
  description: z.string(),
  verified: z.boolean(),
});

const objection = z.object({
  objection: z.string(),
  currentAnswer: z.string().nullable(),
});

const decisionProcess = z
  .object({
    decisionMakers: z.array(z.string()),
    influencers: z.array(z.string()),
    averageCycleLength: z.string(),
    typicalBudget: z.string(),
  })
  .optional();

const audience = z.object({
  segment: z.string(),
  priority: z.enum(["primary", "secondary", "exploratory"]),
  painIntensity: z.string(),
  triggerMoment: z.string(),
  buyingContext: z.string(),
  language: z.array(z.string()),
  channels: z.array(z.string()),
  objections: z.array(objection),
  decisionProcess,
});

const marketingChannel = z.object({
  name: z.string(),
  type: z.enum(["organic", "paid", "referral", "partnership", "offline"]),
  frequency: z.string(),
  perceivedResults: z.enum(["good", "average", "poor", "unknown"]),
  notes: z.string(),
});

export const businessDiscoveryZodSchema = z.object({
  metadata: z.object({
    companyName: z.string(),
    interviewDate: z.string(),
    intervieweeName: z.string(),
    intervieweeRole: z.string(),
    sector: z.enum(["saas", "ecommerce", "agency", "startup", "other"]),
    completionStatus: z.enum(["complete", "partial"]),
    gaps: z.array(z.string()),
  }),
  problem: z.object({
    statement: z.string(),
    painLevel: z.enum(["irritant", "bloquant", "critique"]),
    frequency: z.string(),
    currentAlternatives: z.array(
      z.object({ alternative: z.string(), limitations: z.string() })
    ),
  }),
  valueProposition: z.object({
    transformation: z.object({
      before: z.string(),
      after: z.string(),
      timeToValue: z.string(),
    }),
    uniqueDifferentiator: z.string(),
    proofPoints: z.array(proofPoint),
  }),
  audiences: z.array(audience),
  currentMarketing: z.object({
    channels: z.array(marketingChannel),
    abandonedChannels: z.array(z.object({ name: z.string(), reason: z.string() })),
    bestPerforming: z.string().nullable(),
    biggestGap: z.string().nullable(),
    team: z.object({
      size: z.number(),
      dedicatedToMarketing: z.boolean(),
      skills: z.array(z.string()),
      gaps: z.array(z.string()),
    }),
    budget: z.object({
      range: z.string(),
      allocation: z.string(),
      flexibility: z.enum(["fixed", "adjustable", "undefined"]),
    }),
    tools: z.array(
      z.object({
        name: z.string(),
        category: z.enum([
          "crm",
          "email",
          "social",
          "analytics",
          "automation",
          "content",
          "other",
        ]),
        maturity: z.enum(["well_configured", "underused", "inactive"]),
      })
    ),
  }),
  businessContext: z.object({
    stage: z.enum(["launch", "growth", "consolidation", "scale", "pivot"]),
    stageDetails: z.string(),
    primaryGoal: z.object({
      description: z.string(),
      metric: z.string().nullable(),
      timeline: z.string(),
    }),
    constraints: z.array(
      z.object({
        type: z.enum(["budget", "time", "skills", "seasonality", "dependency", "other"]),
        description: z.string(),
        severity: z.enum(["hard", "soft"]),
      })
    ),
    upcomingEvents: z.array(
      z.object({ event: z.string(), date: z.string(), impact: z.string() })
    ),
    urgency: z.enum(["low", "medium", "high", "critical"]),
  }),
  narrativeSummary: z.string(),
  strategicHypotheses: z.array(z.string()),
});
