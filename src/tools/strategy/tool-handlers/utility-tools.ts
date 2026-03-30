import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { saveStrategy } from "../index";
import type { MarketingStrategy } from "@/types/marketing-strategy";
import type { StrategyRequestState } from "../tool-definitions";
import { jsonResult } from "./mcp-tool-result";

export function createUtilityTools(state: StrategyRequestState) {
  return [
    // Tool 12: saveStrategy
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
        const strategy = args.strategy as unknown as MarketingStrategy;
        const result = await saveStrategy(strategy);
        if (result.success) {
          state.strategyComplete = true;
        }
        return jsonResult(result);
      }
    ),

    // Tool 13: present_choices
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
        return jsonResult("Choices presented to user. Wait for their selection.");
      }
    ),
  ];
}
