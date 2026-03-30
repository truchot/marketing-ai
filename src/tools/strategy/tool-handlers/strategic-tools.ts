import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import {
  generateDiagnostic,
  analyzeTargetMarket,
  defineBusinessStrategy,
  defineMarketingFoundation,
  defineFeedbackLoop,
} from "../index";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type { StrategyRequestState } from "../tool-definitions";
import { jsonResult, errorResult } from "./mcp-tool-result";

export function createStrategicTools(state: StrategyRequestState) {
  return [
    // Tool 1: generateDiagnostic
    tool(
      "generateDiagnostic",
      `Analyse le BusinessDiscovery et produit un diagnostic SWOT + score de maturité marketing.

QUAND L'UTILISER :
- En tout début de session stratégique, dès réception du discovery
- UNE SEULE FOIS par session

EFFET :
- Calcule un score de maturité (0-100) sur 5 dimensions
- Génère un SWOT via Claude Haiku

APRÈS L'APPEL :
- Présente le diagnostic au client
- Demande validation avant de passer au marché cible`,
      {
        discovery: z
          .record(z.string(), z.unknown())
          .describe("L'objet BusinessDiscovery complet issu de la phase discovery"),
      },
      async (args) => {
        const discovery = args.discovery as unknown as BusinessDiscovery;
        state.discovery = discovery;
        const diagnostic = await generateDiagnostic({ discovery });
        state.diagnostic = diagnostic;
        return jsonResult(diagnostic);
      }
    ),

    // Tool 2: analyzeTargetMarket
    tool(
      "analyzeTargetMarket",
      `Analyse le marché cible, priorise les segments et construit le profil client idéal (ICP).

QUAND L'UTILISER :
- Après validation du diagnostic par le client
- UNE SEULE FOIS

PRÉCONDITION :
- Le diagnostic doit être généré

EFFET :
- Identifie et priorise les segments de marché
- Construit un ICP détaillé (pain points, triggers, canaux, objections)

APRÈS L'APPEL :
- Présente le marché cible et l'ICP au client
- Demande validation avant de passer à la stratégie business`,
      {},
      async () => {
        if (!state.discovery || !state.diagnostic) {
          return errorResult("Diagnostic manquant. Appelle generateDiagnostic d'abord.");
        }
        const result = await analyzeTargetMarket({
          discovery: state.discovery,
          diagnostic: state.diagnostic,
        });
        state.targetMarket = result;
        return jsonResult(result);
      }
    ),

    // Tool 3: defineBusinessStrategy
    tool(
      "defineBusinessStrategy",
      `Définit la stratégie business : vision, proposition de valeur, différenciateur, angle concurrentiel.

QUAND L'UTILISER :
- Après validation du marché cible par le client
- UNE SEULE FOIS

PRÉCONDITION :
- Le marché cible doit être validé

EFFET :
- Formule la vision de marque
- Synthétise la proposition de valeur
- Identifie le différenciateur et l'angle concurrentiel

APRÈS L'APPEL :
- Présente la stratégie business au client
- Demande validation avant de passer à la fondation marketing`,
      {},
      async () => {
        if (!state.discovery || !state.diagnostic || !state.targetMarket) {
          return errorResult("Marché cible manquant. Appelle analyzeTargetMarket d'abord.");
        }
        const result = await defineBusinessStrategy({
          discovery: state.discovery,
          diagnostic: state.diagnostic,
          targetMarket: state.targetMarket,
        });
        state.businessStrategy = result;
        return jsonResult(result);
      }
    ),

    // Tool 4: defineMarketingFoundation
    tool(
      "defineMarketingFoundation",
      `Définit la fondation marketing : offre, positionnement et messaging par segment.

QUAND L'UTILISER :
- Après validation de la stratégie business par le client
- UNE SEULE FOIS

PRÉCONDITION :
- La stratégie business doit être validée

EFFET :
- Formule l'offre du point de vue client
- Définit le positionnement (marché, valeur, angle, personnalité)
- Crée le messaging principal et par segment

APRÈS L'APPEL :
- Présente la fondation marketing au client
- Demande validation avant de passer au feedback loop`,
      {},
      async () => {
        if (!state.discovery || !state.targetMarket || !state.businessStrategy) {
          return errorResult("Stratégie business manquante. Appelle defineBusinessStrategy d'abord.");
        }
        const result = await defineMarketingFoundation({
          discovery: state.discovery,
          targetMarket: state.targetMarket,
          businessStrategy: state.businessStrategy,
        });
        state.marketingFoundation = result;
        return jsonResult(result);
      }
    ),

    // Tool 5: defineFeedbackLoop
    tool(
      "defineFeedbackLoop",
      `Définit la boucle de feedback : hypothèses à valider, tests, cadence de review, conditions de pivot.

QUAND L'UTILISER :
- Après validation de la fondation marketing par le client
- UNE SEULE FOIS

PRÉCONDITION :
- La fondation marketing doit être validée

EFFET :
- Reprend et enrichit les hypothèses stratégiques du discovery
- Crée des mécanismes de validation concrets
- Définit la cadence de review et les conditions de pivot

APRÈS L'APPEL :
- Présente la boucle de feedback au client
- Demande validation avant de passer aux OKR`,
      {},
      async () => {
        if (!state.discovery || !state.businessStrategy || !state.marketingFoundation) {
          return errorResult("Fondation marketing manquante. Appelle defineMarketingFoundation d'abord.");
        }
        const result = await defineFeedbackLoop({
          discovery: state.discovery,
          businessStrategy: state.businessStrategy,
          marketingFoundation: state.marketingFoundation,
        });
        state.feedbackLoop = result;
        return jsonResult(result);
      }
    ),
  ];
}
