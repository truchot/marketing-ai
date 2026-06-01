// ============================================================
// Tools strategy pour l'agent Mastra.
//
// Convertit les 6 tools SDK (ancien strategy/tool-definitions.ts) en
// createTool Mastra. La logique métier est RÉUTILISÉE par import depuis
// src/tools/strategy/index.ts — rien n'est réécrit ici.
//
// État de session (diagnostic, OKRs validés, choix, complétion) porté par
// RequestContext sous STRATEGY_STATE_KEY. Voir [[mastra-migration]].
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
  description: `Analyse le BusinessDiscovery et produit un diagnostic SWOT + score de maturité marketing.

QUAND L'UTILISER :
- En tout début de session stratégique, dès réception du discovery
- UNE SEULE FOIS par session

APRÈS L'APPEL :
- Présente le diagnostic au client de manière synthétique
- Demande validation avant de passer aux OKR`,
  inputSchema: z.object({
    discovery: z.record(z.string(), z.unknown()).describe("L'objet BusinessDiscovery complet"),
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
  description: `Génère 2-3 OKR marketing basés sur le diagnostic et le discovery.

QUAND L'UTILISER :
- Après validation du diagnostic par le client
- UNE SEULE FOIS (génère tous les OKR en un appel)`,
  inputSchema: z.object({}),
  outputSchema: z.union([
    z.array(z.record(z.string(), z.unknown())),
    z.object({ error: z.string() }),
  ]),
  execute: async (_inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery || !state?.diagnostic) {
      return { error: "Diagnostic manquant. Appelle generateDiagnostic d'abord." };
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
  description: `Génère des actions concrètes pour un OKR validé (3-4 actions classées quick_win / foundation / strategic).`,
  inputSchema: z.object({
    okrId: z.string().describe("ID de l'OKR pour lequel générer les actions"),
  }),
  outputSchema: z.union([
    z.array(z.record(z.string(), z.unknown())),
    z.object({ error: z.string() }),
  ]),
  execute: async (inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery) return { error: "Discovery manquant." };
    const okr = state.validatedOKRs.find((o) => o.id === inputData.okrId);
    if (!okr) {
      return {
        error: `OKR ${inputData.okrId} non trouvé. OKRs disponibles : ${state.validatedOKRs.map((o) => o.id).join(", ")}`,
      };
    }
    const actions = await proposeActions({ discovery: state.discovery, okr });
    return actions as unknown as Record<string, unknown>[];
  },
});

const adjustOKRTool = createTool({
  id: "adjustOKR",
  description: `Ajuste un OKR existant selon le feedback du client. Peut être appelé plusieurs fois.`,
  inputSchema: z.object({
    okrId: z.string().describe("ID de l'OKR à ajuster"),
    adjustment: z.string().describe("Description du changement demandé par le client"),
  }),
  outputSchema: z.union([
    z.record(z.string(), z.unknown()),
    z.object({ error: z.string() }),
  ]),
  execute: async (inputData, ctx) => {
    const state = getState(ctx?.requestContext);
    if (!state?.discovery) return { error: "Discovery manquant." };
    const okr = state.validatedOKRs.find((o) => o.id === inputData.okrId);
    if (!okr) return { error: `OKR ${inputData.okrId} non trouvé.` };
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
  description: `Persiste la stratégie complète (diagnostic + OKR + actions + roadmap) en mémoire. UNE SEULE FOIS, en fin de session.`,
  inputSchema: z.object({
    strategy: z.record(z.string(), z.unknown()).describe("L'objet MarketingStrategy complet"),
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
    "Utilise cet outil quand tu poses une question à choix fermés. Écris un court texte d'introduction AVANT d'appeler l'outil, et n'inclus PAS les options dans ton texte.",
  inputSchema: z.object({
    question: z.string().describe("La question posée à l'utilisateur"),
    choices: z
      .array(
        z.object({
          value: z.string().describe("Identifiant technique du choix"),
          label: z.string().describe("Libellé affiché"),
          description: z.string().optional().describe("Description courte optionnelle"),
        })
      )
      .describe("Les options proposées"),
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
