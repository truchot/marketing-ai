// ============================================================
// Strategy tools for the Mastra agent.
//
// Converts the 6 SDK tools (former strategy/tool-definitions.ts) into
// Mastra createTool. The business logic is REUSED by importing from
// src/tools/strategy/index.ts — nothing is rewritten here.
//
// Session state (diagnostic, validated OKRs, choices, completion) carried by
// RequestContext under STRATEGY_STATE_KEY. See [[mastra-migration]].
// ============================================================

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  generateDiagnostic,
  proposeOKRs,
  proposeActions,
  saveStrategy,
  adjustOKR,
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

const generateDiagnosticTool = createTool({
  id: "generateDiagnostic",
  description: `Analyzes the BusinessDiscovery and produces a SWOT diagnostic + marketing maturity score.

WHEN TO USE IT:
- At the very start of the strategy session, as soon as the discovery is received
- ONLY ONCE per session

AFTER THE CALL:
- Present the diagnostic to the client in a concise way
- Ask for validation before moving on to the OKRs`,
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
    return diagnostic as unknown as Record<string, unknown>;
  },
});

const proposeOKRTool = createTool({
  id: "proposeOKR",
  description: `Generates 2-3 marketing OKRs based on the diagnostic and the discovery.

WHEN TO USE IT:
- After the diagnostic has been validated by the client
- ONLY ONCE (generates all OKRs in a single call)`,
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
    });
    state.validatedOKRs = okrs;
    return okrs as unknown as Record<string, unknown>[];
  },
});

const proposeActionsTool = createTool({
  id: "proposeActions",
  description: `Generates concrete actions for a validated OKR (3-4 actions classified as quick_win / foundation / strategic).`,
  inputSchema: z.object({
    okrId: z.string().describe("ID of the OKR for which to generate the actions"),
  }),
  outputSchema: z.union([
    z.array(z.record(z.string(), z.unknown())),
    z.object({ error: z.string() }),
  ]),
  execute: async (inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery) return { error: "Missing discovery." };
    const okr = state.validatedOKRs.find((o) => o.id === inputData.okrId);
    if (!okr) {
      return {
        error: `OKR ${inputData.okrId} not found. Available OKRs: ${state.validatedOKRs.map((o) => o.id).join(", ")}`,
      };
    }
    const actions = await proposeActions({ discovery: state.discovery, okr });
    return actions as unknown as Record<string, unknown>[];
  },
});

const adjustOKRTool = createTool({
  id: "adjustOKR",
  description: `Adjusts an existing OKR based on the client's feedback. Can be called multiple times.`,
  inputSchema: z.object({
    okrId: z.string().describe("ID of the OKR to adjust"),
    adjustment: z.string().describe("Description of the change requested by the client"),
  }),
  outputSchema: z.union([
    z.record(z.string(), z.unknown()),
    z.object({ error: z.string() }),
  ]),
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
    return adjusted as unknown as Record<string, unknown>;
  },
});

const saveStrategyTool = createTool({
  id: "saveStrategy",
  description: `Persists the complete strategy (diagnostic + OKR + actions + roadmap) to memory. ONLY ONCE, at the end of the session.`,
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
  proposeOKR: proposeOKRTool,
  proposeActions: proposeActionsTool,
  adjustOKR: adjustOKRTool,
  saveStrategy: saveStrategyTool,
  present_choices: presentChoicesTool,
};
