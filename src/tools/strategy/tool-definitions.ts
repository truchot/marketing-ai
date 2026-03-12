// ============================================================
// Strategy Tools Definitions for Claude Agent SDK
// Using MCP (Model Context Protocol) server approach
// ============================================================

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import {
  generateDiagnostic,
  proposeOKRs,
  proposeActions,
  saveStrategy,
  adjustOKR,
} from "./index";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type { MarketingDiagnostic, OKR, MarketingStrategy } from "@/types/marketing-strategy";

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
  strategyComplete: boolean;
  pendingChoices: { question: string; choices: ChoiceOption[] } | null;
}

export function createStrategyRequestState(): StrategyRequestState {
  return {
    discovery: null,
    diagnostic: null,
    validatedOKRs: [],
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
      // Tool 1: generateDiagnostic
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
      // Tool 2: proposeOKR
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
      // Tool 3: proposeActions
      // ========================================================
      tool(
        "proposeActions",
        `Génère des actions concrètes pour un OKR validé.

QUAND L'UTILISER :
- Après validation d'un OKR par le client
- Pour chaque OKR validé séparément

EFFET :
- Génère 3-4 actions classées par type (quick_win, foundation, strategic)
- Chaque action est liée à un Key Result
- Matrice effort/impact respectée

APRÈS L'APPEL :
- Présente les actions groupées par type
- Quick wins en premier`,
        {
          okrId: z.string().describe("ID de l'OKR pour lequel générer les actions"),
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
          const actions = await proposeActions({
            discovery: state.discovery,
            okr,
          });
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(actions, null, 2),
              },
            ],
          };
        }
      ),

      // ========================================================
      // Tool 4: adjustOKR
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
      // Tool 5: saveStrategy
      // ========================================================
      tool(
        "saveStrategy",
        `Persiste la stratégie complète (diagnostic + OKR + actions + roadmap) en mémoire.

QUAND L'UTILISER :
- À la fin de la session, quand tous les OKR et actions sont validés
- UNE SEULE FOIS

EFFET :
- Crée un épisode de haute importance dans la mémoire épisodique
- Stocke les faits stratégiques clés en mémoire sémantique
- Marque la session comme complète`,
        {
          strategy: z
            .record(z.string(), z.unknown())
            .describe("L'objet MarketingStrategy complet"),
        },
        async (args) => {
          const strategy = args.strategy as unknown as MarketingStrategy;
          const result = await saveStrategy({ strategy });
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
      // Tool 6: present_choices (réutilisation du pattern discovery)
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
