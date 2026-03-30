// ============================================================
// Strategy Tools Definitions for Claude Agent SDK
// Using MCP (Model Context Protocol) server approach
// ============================================================

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import {
  generateDiagnostic,
  proposeOKRs,
  proposeCampaigns,
  proposeTasks,
  saveStrategy,
  adjustOKR,
} from "./index";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type {
  MarketingDiagnostic,
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
  validatedOKRs: OKR[];
  validatedCampaigns: Campaign[];
  strategyComplete: boolean;
  pendingChoices: { question: string; choices: ChoiceOption[] } | null;
}

export function createStrategyRequestState(): StrategyRequestState {
  return {
    discovery: null,
    diagnostic: null,
    validatedOKRs: [],
    validatedCampaigns: [],
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
      // Tool 1: generateDiagnostic (STRATÉGIQUE)
      // ========================================================
      tool(
        "generateDiagnostic",
        `Analyse le BusinessDiscovery et produit un diagnostic SWOT + score de maturité marketing.

QUAND L'UTILISER :
- En tout début de session stratégique, dès réception du discovery
- UNE SEULE FOIS par session

EFFET :
- Calcule un score de maturité (0-100) sur 5 dimensions : canaux, équipe, outils, budget, stratégie
- Génère un SWOT via Claude Haiku
- Stocke le diagnostic en mémoire épisodique

APRÈS L'APPEL :
- Présente le diagnostic au client de manière synthétique
- Demande validation avant de passer aux OKR`,
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
      // Tool 2: proposeOKR (STRATÉGIQUE)
      // ========================================================
      tool(
        "proposeOKR",
        `Génère 2-3 OKR marketing basés sur le diagnostic et le discovery.

QUAND L'UTILISER :
- Après validation du diagnostic par le client
- UNE SEULE FOIS (génère tous les OKR en un appel)

EFFET :
- Génère 2-3 OKR avec Key Results mesurables
- Chaque OKR est lié à un bloc du discovery
- Stocke en mémoire épisodique

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
      // Tool 3: proposeCampaigns (TACTIQUE)
      // ========================================================
      tool(
        "proposeCampaigns",
        `Génère des campagnes tactiques pour un OKR validé, avec stratégie de canaux et plan de contenu.

QUAND L'UTILISER :
- Après validation d'un OKR par le client
- Pour chaque OKR validé séparément

EFFET :
- Génère 1-2 campagnes par OKR avec canaux, messages clés, thèmes de contenu
- Définit la stratégie de canal (rôle, fréquence, budget)
- Propose un plan de contenu par pilier

APRÈS L'APPEL :
- Présente les campagnes au client
- Explique le choix des canaux et la logique du plan`,
        {
          okrId: z.string().describe("ID de l'OKR pour lequel générer les campagnes"),
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
                  text: JSON.stringify({
                    error: `OKR ${args.okrId} non trouvé. OKRs disponibles : ${state.validatedOKRs.map((o) => o.id).join(", ")}`,
                  }),
                },
              ],
            };
          }
          const result = await proposeCampaigns({
            discovery: state.discovery,
            okr,
          });
          state.validatedCampaigns.push(...result.campaigns);
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
      // Tool 4: proposeTasks (OPÉRATIONNEL)
      // ========================================================
      tool(
        "proposeTasks",
        `Génère les tâches opérationnelles concrètes pour une campagne validée, avec calendrier et KPIs hebdo.

QUAND L'UTILISER :
- Après validation d'une campagne par le client
- Pour chaque campagne validée séparément

EFFET :
- Génère 3-5 tâches par campagne avec owner, deadline, heures estimées
- Crée un calendrier éditorial sur 4-6 semaines
- Définit les KPIs de suivi hebdomadaire

APRÈS L'APPEL :
- Présente les tâches au client
- Montre le calendrier éditorial`,
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
          const campaign = state.validatedCampaigns.find((c) => c.id === args.campaignId);
          if (!campaign) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    error: `Campagne ${args.campaignId} non trouvée. Campagnes disponibles : ${state.validatedCampaigns.map((c) => c.id).join(", ")}`,
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
      // Tool 5: adjustOKR (STRATÉGIQUE — feedback loop)
      // ========================================================
      tool(
        "adjustOKR",
        `Ajuste un OKR existant selon le feedback du client.

QUAND L'UTILISER :
- Quand le client demande une modification sur un OKR proposé
- Peut être appelé plusieurs fois

EFFET :
- Modifie l'OKR en tenant compte du feedback
- Met à jour l'état interne`,
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
          // Replace in state
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
      // Tool 6: saveStrategy
      // ========================================================
      tool(
        "saveStrategy",
        `Persiste la stratégie complète (3 niveaux : stratégique + tactique + opérationnel) en mémoire.

QUAND L'UTILISER :
- À la fin de la session, quand les 3 niveaux sont validés
- UNE SEULE FOIS

EFFET :
- Crée un épisode de haute importance dans la mémoire épisodique
- Stocke les faits stratégiques clés en mémoire sémantique
- Marque la session comme complète`,
        {
          strategy: z
            .record(z.string(), z.unknown())
            .describe("L'objet MarketingStrategy complet avec les 3 couches"),
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
      // Tool 7: present_choices (réutilisation du pattern discovery)
      // ========================================================
      tool(
        "present_choices",
        "Utilise cet outil quand tu poses une question à choix fermés. Même fonctionnement que dans la phase discovery. Écris un court texte d'introduction AVANT d'appeler l'outil, et n'inclus PAS les options dans ton texte.",
        {
          question: z.string().describe("La question posée à l'utilisateur"),
          choices: z
            .array(
              z.object({
                value: z
                  .string()
                  .describe("Identifiant technique du choix"),
                label: z.string().describe("Libellé affiché"),
                description: z
                  .string()
                  .optional()
                  .describe("Description courte optionnelle"),
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
