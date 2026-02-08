// ============================================================
// Discovery Tools Definitions for Claude Agent SDK
// Using MCP (Model Context Protocol) server approach
// ============================================================

import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import {
  saveDiscoveryBlock,
  enrichFromWebsite,
  checkCompetitors,
  suggestQuestions,
} from "./index";

// ============================================================
// Per-request state for interview flow control
// ============================================================

interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

let interviewCompleteSignaled = false;
let pendingChoices: { question: string; choices: ChoiceOption[] } | null = null;

export function resetRequestState() {
  interviewCompleteSignaled = false;
  pendingChoices = null;
}

export function isInterviewComplete(): boolean {
  return interviewCompleteSignaled;
}

export function getPendingChoices(): { question: string; choices: ChoiceOption[] } | null {
  return pendingChoices;
}

// Create MCP server with discovery tools
export const discoveryMcpServer = createSdkMcpServer({
  name: "discovery-tools",
  tools: [
    // ========================================================
    // Tool 1: saveDiscoveryBlock (OBLIGATOIRE)
    // ========================================================
    tool(
      "saveDiscoveryBlock",
      `Persiste un bloc validé de discovery dans la mémoire épisodique du système.

QUAND L'UTILISER :
- Après avoir complété un bloc d'interview (problème/valeur, audience, marketing, business)
- Quand l'interlocuteur a validé la synthèse du bloc
- Pour éviter la perte d'information sur les longues conversations

EFFET :
- Crée un épisode dans la mémoire épisodique avec type "discovery"
- Tags automatiques : ["discovery", "block-{n}", "{block-name}", "validated" si validé]
- Permet la récupération du contexte en cas d'interruption de conversation
- Enrichit optionnellement la mémoire sémantique avec les faits clients clés

IMPORTANT : Toujours demander validation à l'interlocuteur avant de sauvegarder avec validatedBy=true.`,
      {
        blockNumber: z.number().int().min(1).max(4).describe("Numéro du bloc (1-4)"),
        blockName: z
          .enum(["problem_value", "audience", "marketing_landscape", "business_context"])
          .describe("Nom technique du bloc"),
        data: z.record(z.string(), z.unknown()).describe("Données partielles de BusinessDiscovery pour ce bloc"),
        validatedBy: z
          .boolean()
          .describe("L'interlocuteur a-t-il validé cette synthèse ? true = validé, false = brouillon"),
      },
      async (args) => {
        const result = await saveDiscoveryBlock({
          blockNumber: args.blockNumber as 1 | 2 | 3 | 4,
          blockName: args.blockName,
          data: args.data,
          validatedBy: args.validatedBy,
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
    // Tool 2: enrichFromWebsite (RECOMMANDÉ)
    // ========================================================
    tool(
      "enrichFromWebsite",
      `Enrichit la découverte en analysant le site web de l'entreprise — NON-BLOQUANT.

L'outil lance l'analyse en arrière-plan et retourne immédiatement. Les insights (proposition de valeur, offres, audience, stack technique, réseaux sociaux, pricing, etc.) sont stockés automatiquement en mémoire sémantique sous forme de ClientFacts.

QUAND L'UTILISER :
- Dès que l'interlocuteur fournit une URL de site web
- Appeler UNE SEULE FOIS par URL, puis continuer l'entretien sans attendre

COMPORTEMENT :
- Retour immédiat (pas de blocage)
- Pipeline en arrière-plan : fetch homepage + about/pricing, analyse Claude Haiku, stockage ~10 ClientFacts
- Les insights enrichissent automatiquement la mémoire sémantique (source: "website_enrichment")
- En cas d'erreur, le pipeline échoue silencieusement — l'entretien n'est jamais impacté

IMPORTANT :
- Ne PAS mentionner l'analyse au client — continuer la conversation normalement
- Les insights seront disponibles via la mémoire sémantique pour les agents suivants`,
      {
        websiteUrl: z.string().url().describe("URL complète du site web (ex: https://example.com)"),
        companyName: z.string().optional().describe("Nom de l'entreprise (optionnel, améliore l'analyse)"),
      },
      async (args) => {
        const result = await enrichFromWebsite({
          websiteUrl: args.websiteUrl,
          companyName: args.companyName,
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
    // Tool 3: checkCompetitors (OPTIONNEL)
    // ========================================================
    tool(
      "checkCompetitors",
      `Analyse rapide des concurrents mentionnés par l'interlocuteur.

QUAND L'UTILISER :
- Quand l'interlocuteur mentionne des concurrents spécifiques
- Pour enrichir la compréhension du paysage concurrentiel
- Maximum 3 concurrents analysés (limite de rapidité)

ANALYSE EXTRAITE (par concurrent) :
- Positionnement principal
- Canaux marketing visibles
- Signaux de pricing

TEMPS : ~8-10 secondes (max 3 concurrents)
MODÈLE : Claude Haiku (rapide et économique)

IMPORTANT :
- Tool rapide, analyse de surface uniquement
- Si insights importants détectés, l'agent peut les sauvegarder via la mémoire
- Ne remplace pas une analyse concurrentielle approfondie`,
      {
        competitorUrls: z.array(z.string().url()).optional().describe("URLs des sites concurrents (max 3 recommandé)"),
        competitorNames: z.array(z.string()).optional().describe("Noms des concurrents sans URL (retournera placeholder)"),
      },
      async (args) => {
        const result = await checkCompetitors({
          competitorUrls: args.competitorUrls,
          competitorNames: args.competitorNames,
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
    // Tool 4: suggestQuestions (OPTIONNEL - Tool interne)
    // ========================================================
    tool(
      "suggestQuestions",
      `Suggère les prochaines questions pertinentes basées sur le secteur et la progression.

QUAND L'UTILISER :
- Pour guidance contextuelle pendant l'interview
- Quand l'agent a besoin d'inspiration pour approfondir un bloc
- Pour s'assurer de ne rien oublier dans un bloc

LOGIQUE :
- Lit la mémoire épisodique (blocs déjà complétés)
- Lookup dans la base de questions par secteur et bloc
- Retourne 3-5 questions prioritaires pour le prochain bloc

SECTEURS SUPPORTÉS :
- saas, ecommerce, agency, startup, other

IMPORTANT :
- Les questions suggérées sont des guides, pas des scripts rigides
- L'agent doit adapter le phrasé au contexte de la conversation
- Privilégier l'écoute active sur le questionnaire systématique`,
      {
        sector: z
          .enum(["saas", "ecommerce", "agency", "startup", "other"])
          .describe("Secteur de l'entreprise"),
        completedBlocks: z
          .array(z.number().int())
          .describe("Numéros des blocs déjà complétés (ex: [1, 2])"),
        currentBlockData: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Données partielles du bloc en cours (optionnel, pour contextualisation)"),
      },
      async (args) => {
        const result = suggestQuestions({
          sector: args.sector,
          completedBlocks: args.completedBlocks,
          currentBlockData: args.currentBlockData,
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
    // Tool 5: signal_interview_complete (OBLIGATOIRE en fin)
    // ========================================================
    tool(
      "signal_interview_complete",
      "Appelle cet outil quand l'entretien de découverte est terminé et que tu as couvert les 4 blocs (problème/proposition de valeur, audiences, marketing actuel, contexte business). Appelle-le en même temps que ton message de clôture.",
      {},
      async () => {
        interviewCompleteSignaled = true;
        return {
          content: [
            { type: "text" as const, text: "Interview marked as complete." },
          ],
        };
      }
    ),

    // ========================================================
    // Tool 6: present_choices (UI - choix fermés)
    // ========================================================
    tool(
      "present_choices",
      "Utilise cet outil quand tu poses une question à choix fermés (ex: secteur d'activité, niveau d'urgence, etc.). Au lieu d'écrire les options dans ton message texte, appelle cet outil pour afficher une interface de sélection claire. N'inclus PAS les options dans ton texte — le composant les affichera. Tu peux écrire un court texte d'introduction avant d'appeler l'outil.",
      {
        question: z.string().describe("La question posée à l'utilisateur"),
        choices: z
          .array(
            z.object({
              value: z
                .string()
                .describe("Identifiant technique du choix (ex: saas)"),
              label: z.string().describe("Libellé affiché (ex: SaaS)"),
              description: z
                .string()
                .optional()
                .describe("Description courte optionnelle"),
            })
          )
          .describe("Les options proposées"),
      },
      async (args) => {
        pendingChoices = {
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
