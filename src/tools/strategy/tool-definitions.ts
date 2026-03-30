// ============================================================
// Strategy Tools Definitions for Claude Agent SDK
// Using MCP (Model Context Protocol) server approach
// ============================================================

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import {
  generateDiagnostic,
  analyzeTargetMarket,
  defineBusinessStrategy,
  defineMarketingFoundation,
  defineFeedbackLoop,
  proposeOKRs,
  proposeMarketingPlan,
  proposeMarketingSystem,
  proposeTasks,
  saveStrategy,
  adjustOKR,
} from "./index";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type {
  MarketingDiagnostic,
  TargetMarket,
  BusinessStrategy,
  MarketingFoundation,
  FeedbackLoop,
  MarketingPlan,
  MarketingSystem,
  OKR,
  Campaign,
} from "@/types/marketing-strategy";

// ============================================================
// Per-request state for strategy session flow control
// ============================================================

interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export interface StrategyRequestState {
  discovery: BusinessDiscovery | null;
  diagnostic: MarketingDiagnostic | null;
  targetMarket: TargetMarket | null;
  businessStrategy: BusinessStrategy | null;
  marketingFoundation: MarketingFoundation | null;
  feedbackLoop: FeedbackLoop | null;
  validatedOKRs: OKR[];
  validatedMarketingPlan: MarketingPlan | null;
  validatedMarketingSystem: MarketingSystem | null;
  strategyComplete: boolean;
  pendingChoices: { question: string; choices: ChoiceOption[] } | null;
}

export function createStrategyRequestState(): StrategyRequestState {
  return {
    discovery: null,
    diagnostic: null,
    targetMarket: null,
    businessStrategy: null,
    marketingFoundation: null,
    feedbackLoop: null,
    validatedOKRs: [],
    validatedMarketingPlan: null,
    validatedMarketingSystem: null,
    strategyComplete: false,
    pendingChoices: null,
  };
}

// ============================================================
// Factory: creates a fresh MCP server per request
// ============================================================

export function createStrategyMcpServer(state: StrategyRequestState) {
  return createSdkMcpServer({
    name: "strategy-tools",
    tools: [
      // ========================================================
      // Tool 1: generateDiagnostic (STRATÉGIQUE — cross-cutting)
      // ========================================================
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
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(diagnostic, null, 2),
              },
            ],
          };
        }
      ),

      // ========================================================
      // Tool 2: analyzeTargetMarket (STRATÉGIQUE — Subsystem 1)
      // ========================================================
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
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Diagnostic manquant. Appelle generateDiagnostic d'abord.",
                  }),
                },
              ],
            };
          }
          const result = await analyzeTargetMarket({
            discovery: state.discovery,
            diagnostic: state.diagnostic,
          });
          state.targetMarket = result;
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
      ),

      // ========================================================
      // Tool 3: defineBusinessStrategy (STRATÉGIQUE — Subsystem 2)
      // ========================================================
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
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Marché cible manquant. Appelle analyzeTargetMarket d'abord.",
                  }),
                },
              ],
            };
          }
          const result = await defineBusinessStrategy({
            discovery: state.discovery,
            diagnostic: state.diagnostic,
            targetMarket: state.targetMarket,
          });
          state.businessStrategy = result;
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
      ),

      // ========================================================
      // Tool 4: defineMarketingFoundation (STRATÉGIQUE — Subsystem 4)
      // ========================================================
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
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Stratégie business manquante. Appelle defineBusinessStrategy d'abord.",
                  }),
                },
              ],
            };
          }
          const result = await defineMarketingFoundation({
            discovery: state.discovery,
            targetMarket: state.targetMarket,
            businessStrategy: state.businessStrategy,
          });
          state.marketingFoundation = result;
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
      ),

      // ========================================================
      // Tool 5: defineFeedbackLoop (STRATÉGIQUE — Subsystem 3)
      // ========================================================
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
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Fondation marketing manquante. Appelle defineMarketingFoundation d'abord.",
                  }),
                },
              ],
            };
          }
          const result = await defineFeedbackLoop({
            discovery: state.discovery,
            businessStrategy: state.businessStrategy,
            marketingFoundation: state.marketingFoundation,
          });
          state.feedbackLoop = result;
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
      ),

      // ========================================================
      // Tool 6: proposeOKR (STRATÉGIQUE — cross-cutting)
      // ========================================================
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
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Diagnostic manquant. Appelle generateDiagnostic d'abord.",
                  }),
                },
              ],
            };
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
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(okrs, null, 2),
              },
            ],
          };
        }
      ),

      // ========================================================
      // Tool 7: proposeMarketingPlan (TACTIQUE — Subsystem 5)
      // ========================================================
      tool(
        "proposeMarketingPlan",
        `Génère le Marketing Plan complet : campagnes pour tous les OKRs, stratégie de canaux, plan de contenu, allocation budget, KPIs tactiques et roadmap.

QUAND L'UTILISER :
- Après validation de tous les OKR par le client
- UNE SEULE FOIS (génère le plan pour tous les OKRs d'un coup)

PRÉCONDITION :
- Tous les OKRs doivent être validés
- Les 4 sous-systèmes stratégiques doivent être validés

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
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Sous-systèmes stratégiques manquants. Complète d'abord les phases stratégiques.",
                  }),
                },
              ],
            };
          }
          if (state.validatedOKRs.length === 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({ error: "Aucun OKR validé. Appelle proposeOKR d'abord." }),
                },
              ],
            };
          }
          const result = await proposeMarketingPlan({
            discovery: state.discovery,
            okrs: state.validatedOKRs,
            targetMarket: state.targetMarket,
            businessStrategy: state.businessStrategy,
            marketingFoundation: state.marketingFoundation,
          });
          state.validatedMarketingPlan = result;
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
      ),

      // ========================================================
      // Tool 8: proposeMarketingSystem (TACTIQUE — Subsystem 6)
      // ========================================================
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
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({ error: "Discovery ou stratégie business manquant." }),
                },
              ],
            };
          }
          if (!state.validatedMarketingPlan) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Marketing Plan manquant. Appelle proposeMarketingPlan d'abord.",
                  }),
                },
              ],
            };
          }
          const result = await proposeMarketingSystem({
            discovery: state.discovery,
            marketingPlan: state.validatedMarketingPlan,
            businessStrategy: state.businessStrategy,
          });
          state.validatedMarketingSystem = result;
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
      ),

      // ========================================================
      // Tool 9: proposeTasks (OPÉRATIONNEL)
      // ========================================================
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
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({ error: "Discovery manquant." }),
                },
              ],
            };
          }
          if (!state.validatedMarketingPlan) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({ error: "Marketing Plan manquant. Appelle proposeMarketingPlan d'abord." }),
                },
              ],
            };
          }
          const campaign = state.validatedMarketingPlan.campaigns.find((c) => c.id === args.campaignId);
          if (!campaign) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    error: `Campagne ${args.campaignId} non trouvée. Campagnes disponibles : ${state.validatedMarketingPlan.campaigns.map((c) => c.id).join(", ")}`,
                  }),
                },
              ],
            };
          }
          const result = await proposeTasks({
            discovery: state.discovery,
            campaign,
          });
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
      ),

      // ========================================================
      // Tool 10: adjustOKR (STRATÉGIQUE — feedback loop)
      // ========================================================
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
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({ error: "Discovery manquant." }),
                },
              ],
            };
          }
          const okr = state.validatedOKRs.find((o) => o.id === args.okrId);
          if (!okr) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({ error: `OKR ${args.okrId} non trouvé.` }),
                },
              ],
            };
          }
          const adjusted = await adjustOKR({
            okr,
            adjustment: args.adjustment,
            discovery: state.discovery,
          });
          state.validatedOKRs = state.validatedOKRs.map((o) =>
            o.id === args.okrId ? adjusted : o
          );
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(adjusted, null, 2),
              },
            ],
          };
        }
      ),

      // ========================================================
      // Tool 11: saveStrategy
      // ========================================================
      tool(
        "saveStrategy",
        `Persiste la stratégie complète (3 niveaux avec 6 sous-systèmes) en mémoire.

QUAND L'UTILISER :
- À la fin de la session, quand tout est validé
- UNE SEULE FOIS`,
        {
          strategy: z
            .record(z.string(), z.unknown())
            .describe("L'objet MarketingStrategy complet"),
        },
        async (args) => {
          const strategy = args.strategy as unknown as import("@/types/marketing-strategy").MarketingStrategy;
          const result = await saveStrategy(strategy);
          if (result.success) {
            state.strategyComplete = true;
          }
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }
      ),

      // ========================================================
      // Tool 12: present_choices
      // ========================================================
      tool(
        "present_choices",
        "Utilise cet outil quand tu poses une question à choix fermés. Écris un court texte d'introduction AVANT d'appeler l'outil, et n'inclus PAS les options dans ton texte.",
        {
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
        },
        async (args) => {
          state.pendingChoices = {
            question: args.question,
            choices: args.choices.map((c) => ({
              value: c.value,
              label: c.label,
              description: c.description ?? undefined,
            })),
          };
          return {
            content: [
              {
                type: "text" as const,
                text: "Choices presented to user. Wait for their selection.",
              },
            ],
          };
        }
      ),
    ],
  });
}
