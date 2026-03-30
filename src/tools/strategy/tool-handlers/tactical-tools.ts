import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { proposeMarketingPlan, proposeMarketingSystem, proposeTasks } from "../index";
import type { StrategyRequestState } from "../tool-definitions";
import { jsonResult, errorResult } from "./mcp-tool-result";

export function createTacticalTools(state: StrategyRequestState) {
  return [
    // Tool 8: proposeMarketingPlan
    tool(
      "proposeMarketingPlan",
      `Génère le Marketing Plan complet : campagnes pour tous les OKRs, stratégie de canaux, plan de contenu, allocation budget, KPIs tactiques et roadmap.

QUAND L'UTILISER :
- Après validation de tous les OKR par le client
- UNE SEULE FOIS (génère le plan pour tous les OKRs d'un coup)

PRÉCONDITION :
- Tous les OKRs doivent être validés
- Les 4 sous-systèmes stratégiques doivent être validés
- Le roadmap validation doit recommander "proceed"

EFFET :
- Génère 1-2 campagnes par OKR avec canaux, messages clés, thèmes de contenu
- Définit la stratégie de canal globale et le plan de contenu
- Alloue le budget sur l'ensemble des campagnes (~100%)
- Définit les KPIs tactiques par campagne
- Crée un roadmap phasé avec jalons

APRÈS L'APPEL :
- Présente le Marketing Plan au client
- Explique le choix des canaux et le phasage`,
      {},
      async () => {
        if (!state.discovery || !state.targetMarket || !state.businessStrategy || !state.marketingFoundation) {
          return errorResult("Sous-systèmes stratégiques manquants. Complète d'abord les phases stratégiques.");
        }
        if (state.validatedOKRs.length === 0) {
          return errorResult("Aucun OKR validé. Appelle proposeOKR d'abord.");
        }
        const result = await proposeMarketingPlan({
          discovery: state.discovery,
          okrs: state.validatedOKRs,
          targetMarket: state.targetMarket,
          businessStrategy: state.businessStrategy,
          marketingFoundation: state.marketingFoundation,
        });
        state.validatedMarketingPlan = result;
        return jsonResult(result);
      }
    ),

    // Tool 9: proposeMarketingSystem
    tool(
      "proposeMarketingSystem",
      `Conçoit le Marketing System : backlog d'items à configurer, processus récurrents, automations et architecture système.

QUAND L'UTILISER :
- Après validation du Marketing Plan par le client
- UNE SEULE FOIS

PRÉCONDITION :
- Le Marketing Plan doit être validé

EFFET :
- Crée un backlog d'items à configurer (outils, templates, intégrations)
- Définit les processus marketing récurrents
- Propose des automations réalistes avec les outils disponibles
- Dessine l'architecture système avec flux de données

APRÈS L'APPEL :
- Présente le Marketing System au client
- Explique les priorités du backlog et les processus clés`,
      {},
      async () => {
        if (!state.discovery || !state.businessStrategy) {
          return errorResult("Discovery ou stratégie business manquant.");
        }
        if (!state.validatedMarketingPlan) {
          return errorResult("Marketing Plan manquant. Appelle proposeMarketingPlan d'abord.");
        }
        const result = await proposeMarketingSystem({
          discovery: state.discovery,
          marketingPlan: state.validatedMarketingPlan,
          businessStrategy: state.businessStrategy,
        });
        state.validatedMarketingSystem = result;
        return jsonResult(result);
      }
    ),

    // Tool 10: proposeTasks
    tool(
      "proposeTasks",
      `Génère les tâches opérationnelles pour une campagne validée, avec calendrier et KPIs hebdo.

QUAND L'UTILISER :
- Après validation d'une campagne par le client
- Pour chaque campagne validée séparément

EFFET :
- Génère 3-5 tâches par campagne avec owner, deadline, heures estimées
- Crée un calendrier éditorial sur 4-6 semaines
- Définit les KPIs de suivi hebdomadaire`,
      {
        campaignId: z.string().describe("ID de la campagne pour laquelle générer les tâches"),
      },
      async (args) => {
        if (!state.discovery) {
          return errorResult("Discovery manquant.");
        }
        if (!state.validatedMarketingPlan) {
          return errorResult("Marketing Plan manquant. Appelle proposeMarketingPlan d'abord.");
        }
        const campaign = state.validatedMarketingPlan.campaigns.find((c) => c.id === args.campaignId);
        if (!campaign) {
          return errorResult(`Campagne ${args.campaignId} non trouvée. Campagnes disponibles : ${state.validatedMarketingPlan.campaigns.map((c) => c.id).join(", ")}`);
        }
        const result = await proposeTasks({
          discovery: state.discovery,
          campaign,
        });
        return jsonResult(result);
      }
    ),
  ];
}
