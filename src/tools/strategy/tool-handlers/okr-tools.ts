import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { proposeOKRs, adjustOKR, validateRoadmap } from "../index";
import type { StrategyRequestState } from "../tool-definitions";
import { jsonResult, errorResult } from "./mcp-tool-result";

export function createOKRTools(state: StrategyRequestState) {
  return [
    // Tool 6: proposeOKR
    tool(
      "proposeOKR",
      `Génère 2-3 OKR marketing basés sur le diagnostic ET les 4 sous-systèmes stratégiques validés.

QUAND L'UTILISER :
- Après validation des 4 sous-systèmes stratégiques
- UNE SEULE FOIS (génère tous les OKR en un appel)

PRÉCONDITION :
- Les 4 sous-systèmes doivent être validés (target market, business strategy, marketing foundation, feedback loop)

EFFET :
- Génère 2-3 OKR informés par toute la couche stratégique
- Chaque OKR est lié à un bloc du discovery

APRÈS L'APPEL :
- Présente les OKR un par un au client
- Demande validation/ajustement pour chacun`,
      {},
      async () => {
        if (!state.discovery || !state.diagnostic) {
          return errorResult("Diagnostic manquant. Appelle generateDiagnostic d'abord.");
        }
        const okrs = await proposeOKRs({
          discovery: state.discovery,
          diagnostic: state.diagnostic,
          existingOKRs: state.validatedOKRs,
          targetMarket: state.targetMarket ?? undefined,
          businessStrategy: state.businessStrategy ?? undefined,
          marketingFoundation: state.marketingFoundation ?? undefined,
          feedbackLoop: state.feedbackLoop ?? undefined,
        });
        state.validatedOKRs = okrs;
        return jsonResult(okrs);
      }
    ),

    // Tool 7: validateRoadmap
    tool(
      "validateRoadmap",
      `Évalue la cohérence de la couche stratégique avant de passer aux tactiques. Produit un résumé des 4 questions clés (qui, quel problème, comment on se différencie, que dit-on), un score de readiness, les lacunes identifiées et une recommandation (proceed / refine / rethink).

QUAND L'UTILISER :
- Après validation de tous les OKRs par le client
- AVANT de passer aux tactiques (proposeMarketingPlan)

PRÉCONDITION :
- Les 4 sous-systèmes stratégiques doivent être validés
- Au moins 1 OKR validé

EFFET :
- Produit un RoadmapValidation avec strategySummary, readinessScore, gaps, recommendation
- Si recommendation = "proceed" → on peut passer aux tactiques
- Si recommendation = "refine" → présenter les gaps au client, ajuster
- Si recommendation = "rethink" → retour aux sous-systèmes stratégiques

APRÈS L'APPEL :
- Présente le résultat au client
- Si "proceed" : enchaîner avec proposeMarketingPlan
- Si "refine" : discuter les lacunes et ajuster les sous-systèmes concernés`,
      {},
      async () => {
        if (!state.targetMarket || !state.businessStrategy || !state.marketingFoundation || !state.feedbackLoop) {
          return errorResult("Les 4 sous-systèmes stratégiques doivent être validés avant la validation roadmap.");
        }
        if (state.validatedOKRs.length === 0) {
          return errorResult("Aucun OKR validé. Appelle proposeOKR d'abord.");
        }
        const result = await validateRoadmap({
          targetMarket: state.targetMarket,
          businessStrategy: state.businessStrategy,
          marketingFoundation: state.marketingFoundation,
          feedbackLoop: state.feedbackLoop,
          okrs: state.validatedOKRs,
        });
        state.roadmapValidation = result;
        return jsonResult(result);
      }
    ),

    // Tool 11: adjustOKR
    tool(
      "adjustOKR",
      `Ajuste un OKR existant selon le feedback du client.

QUAND L'UTILISER :
- Quand le client demande une modification sur un OKR proposé
- Peut être appelé plusieurs fois`,
      {
        okrId: z.string().describe("ID de l'OKR à ajuster"),
        adjustment: z
          .string()
          .describe("Description du changement demandé par le client"),
      },
      async (args) => {
        if (!state.discovery) {
          return errorResult("Discovery manquant.");
        }
        const okr = state.validatedOKRs.find((o) => o.id === args.okrId);
        if (!okr) {
          return errorResult(`OKR ${args.okrId} non trouvé.`);
        }
        const adjusted = await adjustOKR({
          okr,
          adjustment: args.adjustment,
          discovery: state.discovery,
        });
        state.validatedOKRs = state.validatedOKRs.map((o) =>
          o.id === args.okrId ? adjusted : o
        );
        return jsonResult(adjusted);
      }
    ),
  ];
}
