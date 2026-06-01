// ============================================================
// Strategy tools for the Mastra agent.
//
// Converts the strategy MCP tools into Mastra createTool wrappers. The
// business logic is REUSED by importing the impl functions from
// src/tools/strategy/index.ts — nothing is rewritten here.
//
// The 3-level / 6-subsystem flow is stateful: each step's output is stored on
// the per-request session state (carried by RequestContext under
// STRATEGY_STATE_KEY) and read by the later steps. Each tool gates on its
// prerequisites and returns `{ error }` when they're missing. See
// [[mastra-migration]].
// ============================================================

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  generateDiagnostic,
  analyzeTargetMarket,
  defineBusinessStrategy,
  defineMarketingFoundation,
  defineFeedbackLoop,
  proposeOKRs,
  adjustOKR,
  validateRoadmap,
  proposeMarketingPlan,
  proposeMarketingSystem,
  proposeTasks,
  saveStrategy,
} from "@/tools/strategy";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type { MarketingStrategy } from "@/types/marketing-strategy";
import {
  STRATEGY_STATE_KEY,
  type StrategySessionState,
} from "@/mastra/runtime/strategy-state";
import type { RequestContext } from "@mastra/core/request-context";

function getState(requestContext?: RequestContext): StrategySessionState | undefined {
  return requestContext?.get(STRATEGY_STATE_KEY) as StrategySessionState | undefined;
}

const asRecord = <T>(v: T): Record<string, unknown> => v as unknown as Record<string, unknown>;
const recordOrError = z.union([
  z.record(z.string(), z.unknown()),
  z.object({ error: z.string() }),
]);

// ─── Phase 1: Diagnostic ───────────────────────────────────

const generateDiagnosticTool = createTool({
  id: "generateDiagnostic",
  description: `Analyzes the BusinessDiscovery and produces a SWOT diagnostic + marketing maturity score.

WHEN TO USE IT:
- At the very start of the strategy session, as soon as the discovery is received
- ONLY ONCE per session

AFTER THE CALL:
- Present the diagnostic to the client concisely, then ask for validation before continuing.`,
  inputSchema: z.object({
    discovery: z.record(z.string(), z.unknown()).describe("The complete BusinessDiscovery object"),
  }),
  outputSchema: z.record(z.string(), z.unknown()),
  execute: async (inputData, ctx) => {
    const discovery = inputData.discovery as unknown as BusinessDiscovery;
    const state = getState(ctx?.requestContext);
    if (state) state.discovery = discovery;
    const diagnostic = await generateDiagnostic({ discovery });
    if (state) state.diagnostic = diagnostic;
    return asRecord(diagnostic);
  },
});

// ─── Phase 2-5: Strategic subsystems ───────────────────────

const analyzeTargetMarketTool = createTool({
  id: "analyzeTargetMarket",
  description: `Strategic subsystem 1/4 — analyzes the target market: prioritized segments and ideal customer profile (ICP). Call after the diagnostic is validated.`,
  inputSchema: z.object({}),
  outputSchema: recordOrError,
  execute: async (_inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery || !state?.diagnostic) {
      return { error: "Missing diagnostic. Call generateDiagnostic first." };
    }
    const result = await analyzeTargetMarket({
      discovery: state.discovery,
      diagnostic: state.diagnostic,
    });
    state.targetMarket = result;
    return asRecord(result);
  },
});

const defineBusinessStrategyTool = createTool({
  id: "defineBusinessStrategy",
  description: `Strategic subsystem 2/4 — defines the business strategy: vision, value proposition, transformation, differentiator, revenue targets. Call after the target market is validated.`,
  inputSchema: z.object({}),
  outputSchema: recordOrError,
  execute: async (_inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery || !state?.diagnostic) {
      return { error: "Missing diagnostic. Call generateDiagnostic first." };
    }
    if (!state.targetMarket) {
      return { error: "Missing target market. Call analyzeTargetMarket first." };
    }
    const result = await defineBusinessStrategy({
      discovery: state.discovery,
      diagnostic: state.diagnostic,
      targetMarket: state.targetMarket,
    });
    state.businessStrategy = result;
    return asRecord(result);
  },
});

const defineMarketingFoundationTool = createTool({
  id: "defineMarketingFoundation",
  description: `Strategic subsystem 3/4 — defines the marketing foundation: offer, positioning, messaging per segment. Call after the business strategy is validated.`,
  inputSchema: z.object({}),
  outputSchema: recordOrError,
  execute: async (_inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery) return { error: "Missing discovery." };
    if (!state.targetMarket || !state.businessStrategy) {
      return { error: "Missing target market or business strategy. Complete the prior subsystems first." };
    }
    const result = await defineMarketingFoundation({
      discovery: state.discovery,
      targetMarket: state.targetMarket,
      businessStrategy: state.businessStrategy,
    });
    state.marketingFoundation = result;
    return asRecord(result);
  },
});

const defineFeedbackLoopTool = createTool({
  id: "defineFeedbackLoop",
  description: `Strategic subsystem 4/4 — defines the feedback loop: hypotheses, validation tests, pivot triggers. Call after the marketing foundation is validated.`,
  inputSchema: z.object({}),
  outputSchema: recordOrError,
  execute: async (_inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery) return { error: "Missing discovery." };
    if (!state.businessStrategy || !state.marketingFoundation) {
      return { error: "Missing business strategy or marketing foundation. Complete the prior subsystems first." };
    }
    const result = await defineFeedbackLoop({
      discovery: state.discovery,
      businessStrategy: state.businessStrategy,
      marketingFoundation: state.marketingFoundation,
    });
    state.feedbackLoop = result;
    return asRecord(result);
  },
});

// ─── Phase 6: OKRs ─────────────────────────────────────────

const proposeOKRTool = createTool({
  id: "proposeOKR",
  description: `Generates 2-3 marketing OKRs based on the diagnostic, the discovery and the strategic subsystems. ONLY ONCE (generates all OKRs in a single call).`,
  inputSchema: z.object({}),
  outputSchema: z.union([
    z.array(z.record(z.string(), z.unknown())),
    z.object({ error: z.string() }),
  ]),
  execute: async (_inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery || !state?.diagnostic) {
      return { error: "Missing diagnostic. Call generateDiagnostic first." };
    }
    const okrs = await proposeOKRs({
      discovery: state.discovery,
      diagnostic: state.diagnostic,
      existingOKRs: state.validatedOKRs,
      targetMarket: state.targetMarket ?? undefined,
      businessStrategy: state.businessStrategy ?? undefined,
      marketingFoundation: state.marketingFoundation ?? undefined,
    });
    state.validatedOKRs = okrs;
    return okrs.map(asRecord);
  },
});

const adjustOKRTool = createTool({
  id: "adjustOKR",
  description: `Adjusts an existing OKR based on the client's feedback. Can be called multiple times.`,
  inputSchema: z.object({
    okrId: z.string().describe("ID of the OKR to adjust"),
    adjustment: z.string().describe("Description of the change requested by the client"),
  }),
  outputSchema: recordOrError,
  execute: async (inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery) return { error: "Missing discovery." };
    const okr = state.validatedOKRs.find((o) => o.id === inputData.okrId);
    if (!okr) return { error: `OKR ${inputData.okrId} not found.` };
    const adjusted = await adjustOKR({
      okr,
      adjustment: inputData.adjustment,
      discovery: state.discovery,
    });
    state.validatedOKRs = state.validatedOKRs.map((o) =>
      o.id === inputData.okrId ? adjusted : o
    );
    return asRecord(adjusted);
  },
});

// ─── Phase 7: Roadmap validation gate (Strategy → Tactics) ──

const validateRoadmapTool = createTool({
  id: "validateRoadmap",
  description: `Gate between the strategic and tactical layers. Evaluates the coherence of the 4 strategic subsystems + OKRs before moving to tactics. Call once the OKRs are validated.`,
  inputSchema: z.object({}),
  outputSchema: recordOrError,
  execute: async (_inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.targetMarket || !state?.businessStrategy || !state?.marketingFoundation || !state?.feedbackLoop) {
      return { error: "All 4 strategic subsystems must be defined first." };
    }
    if (state.validatedOKRs.length === 0) {
      return { error: "At least one OKR must be validated first." };
    }
    const result = await validateRoadmap({
      targetMarket: state.targetMarket,
      businessStrategy: state.businessStrategy,
      marketingFoundation: state.marketingFoundation,
      feedbackLoop: state.feedbackLoop,
      okrs: state.validatedOKRs,
    });
    state.roadmapValidation = result;
    return asRecord(result);
  },
});

// ─── Phase 8-9: Tactical subsystems ────────────────────────

const proposeMarketingPlanTool = createTool({
  id: "proposeMarketingPlan",
  description: `Tactical subsystem 1/2 — generates the complete marketing plan: campaigns, channel strategy, content plan, budget allocation, tactical KPIs, phased roadmap.`,
  inputSchema: z.object({}),
  outputSchema: recordOrError,
  execute: async (_inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery) return { error: "Missing discovery." };
    if (!state.targetMarket || !state.businessStrategy || !state.marketingFoundation) {
      return { error: "Strategic subsystems must be completed first." };
    }
    if (state.validatedOKRs.length === 0) {
      return { error: "OKRs must be validated first." };
    }
    const result = await proposeMarketingPlan({
      discovery: state.discovery,
      okrs: state.validatedOKRs,
      targetMarket: state.targetMarket,
      businessStrategy: state.businessStrategy,
      marketingFoundation: state.marketingFoundation,
    });
    state.marketingPlan = result;
    return asRecord(result);
  },
});

const proposeMarketingSystemTool = createTool({
  id: "proposeMarketingSystem",
  description: `Tactical subsystem 2/2 — designs the marketing system: backlog, recurring processes, automations, system architecture.`,
  inputSchema: z.object({}),
  outputSchema: recordOrError,
  execute: async (_inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery || !state?.businessStrategy) {
      return { error: "Missing discovery or business strategy." };
    }
    if (!state.marketingPlan) {
      return { error: "Marketing plan must be proposed first." };
    }
    const result = await proposeMarketingSystem({
      discovery: state.discovery,
      marketingPlan: state.marketingPlan,
      businessStrategy: state.businessStrategy,
    });
    state.marketingSystem = result;
    return asRecord(result);
  },
});

// ─── Phase 10: Operational tasks (per campaign) ────────────

const proposeTasksTool = createTool({
  id: "proposeTasks",
  description: `Operational layer — generates concrete tasks for a campaign of the marketing plan. Call once per campaign that needs an execution breakdown.`,
  inputSchema: z.object({
    campaignId: z.string().describe("ID of the campaign (from the validated marketing plan) to break down into tasks"),
  }),
  outputSchema: recordOrError,
  execute: async (inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery) return { error: "Missing discovery." };
    if (!state.marketingPlan) return { error: "Marketing plan must be proposed first." };
    const campaign = state.marketingPlan.campaigns.find((c) => c.id === inputData.campaignId);
    if (!campaign) {
      return {
        error: `Campaign ${inputData.campaignId} not found. Available campaigns: ${state.marketingPlan.campaigns.map((c) => c.id).join(", ")}`,
      };
    }
    const result = await proposeTasks({ discovery: state.discovery, campaign });
    return asRecord(result);
  },
});

// ─── Phase 11: Persist ─────────────────────────────────────

const saveStrategyTool = createTool({
  id: "saveStrategy",
  description: `Persists the complete strategy (strategic + tactical + operational layers) to memory. ONLY ONCE, at the end of the session.`,
  inputSchema: z.object({
    strategy: z.record(z.string(), z.unknown()).describe("The complete MarketingStrategy object"),
  }),
  outputSchema: z.object({ success: z.boolean(), message: z.string().optional() }),
  execute: async (inputData, ctx) => {
    const strategy = inputData.strategy as unknown as MarketingStrategy;
    const result = await saveStrategy(strategy);
    const state = getState(ctx?.requestContext);
    if (state && result.success) state.strategyComplete = true;
    return result;
  },
});

// ─── UI: closed-choice prompts ─────────────────────────────

const presentChoicesTool = createTool({
  id: "present_choices",
  description:
    "Use this tool when you ask a closed-ended question. Write a short introductory text BEFORE calling the tool, and do NOT include the options in your text.",
  inputSchema: z.object({
    question: z.string().describe("The question asked to the user"),
    choices: z
      .array(
        z.object({
          value: z.string().describe("Technical identifier of the choice"),
          label: z.string().describe("Displayed label"),
          description: z.string().optional().describe("Optional short description"),
        })
      )
      .describe("The proposed options"),
  }),
  outputSchema: z.object({ presented: z.boolean() }),
  execute: async (inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (state) {
      state.pendingChoices = {
        question: inputData.question,
        choices: inputData.choices.map((c) => ({
          value: c.value,
          label: c.label,
          description: c.description ?? undefined,
        })),
      };
    }
    return { presented: true };
  },
});

export const strategyTools = {
  generateDiagnostic: generateDiagnosticTool,
  analyzeTargetMarket: analyzeTargetMarketTool,
  defineBusinessStrategy: defineBusinessStrategyTool,
  defineMarketingFoundation: defineMarketingFoundationTool,
  defineFeedbackLoop: defineFeedbackLoopTool,
  proposeOKR: proposeOKRTool,
  adjustOKR: adjustOKRTool,
  validateRoadmap: validateRoadmapTool,
  proposeMarketingPlan: proposeMarketingPlanTool,
  proposeMarketingSystem: proposeMarketingSystemTool,
  proposeTasks: proposeTasksTool,
  saveStrategy: saveStrategyTool,
  present_choices: presentChoicesTool,
};
