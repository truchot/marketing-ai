// ============================================================
// Tools discovery pour l'agent Mastra.
//
// Convertit les 6 tools SDK (ancien tool-definitions.ts) en createTool
// Mastra. La logique métier est RÉUTILISÉE par import depuis
// src/tools/discovery/index.ts — rien n'est réécrit ici.
//
// Le contrôle de flux (present_choices / signal_interview_complete) est
// détecté par la route via les tool-calls du stream ; ces deux tools se
// contentent donc d'accuser réception.
// ============================================================

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  saveDiscoveryBlock,
  enrichFromWebsite,
  checkCompetitors,
  suggestQuestions,
} from "@/tools/discovery";

const saveDiscoveryBlockTool = createTool({
  id: "saveDiscoveryBlock",
  description: `Persiste un bloc validé de discovery dans la mémoire épisodique du système.

QUAND L'UTILISER :
- Après avoir complété un bloc d'interview (problème/valeur, audience, marketing, business)
- Quand l'interlocuteur a validé la synthèse du bloc
- Pour éviter la perte d'information sur les longues conversations

IMPORTANT : Toujours demander validation à l'interlocuteur avant de sauvegarder avec validatedBy=true.`,
  inputSchema: z.object({
    blockNumber: z.number().int().min(1).max(4).describe("Numéro du bloc (1-4)"),
    blockName: z
      .enum(["problem_value", "audience", "marketing_landscape", "business_context"])
      .describe("Nom technique du bloc"),
    data: z.record(z.string(), z.unknown()).describe("Données partielles de BusinessDiscovery pour ce bloc"),
    validatedBy: z
      .boolean()
      .describe("L'interlocuteur a-t-il validé cette synthèse ? true = validé, false = brouillon"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    episodeId: z.string(),
  }),
  execute: async (inputData) =>
    saveDiscoveryBlock({
      blockNumber: inputData.blockNumber as 1 | 2 | 3 | 4,
      blockName: inputData.blockName,
      data: inputData.data,
      validatedBy: inputData.validatedBy,
    }),
});

const enrichFromWebsiteTool = createTool({
  id: "enrichFromWebsite",
  description: `Enrichit la découverte en analysant le site web de l'entreprise — NON-BLOQUANT.

L'outil lance l'analyse en arrière-plan et retourne immédiatement. Les insights (proposition de valeur, offres, audience, stack technique, réseaux sociaux, pricing, etc.) sont stockés automatiquement en mémoire sémantique sous forme de ClientFacts.

QUAND L'UTILISER :
- Dès que l'interlocuteur fournit une URL de site web
- Appeler UNE SEULE FOIS par URL, puis continuer l'entretien sans attendre

IMPORTANT :
- Ne PAS mentionner l'analyse au client — continuer la conversation normalement`,
  inputSchema: z.object({
    websiteUrl: z.string().url().describe("URL complète du site web (ex: https://example.com)"),
    companyName: z.string().optional().describe("Nom de l'entreprise (optionnel, améliore l'analyse)"),
  }),
  outputSchema: z.object({
    started: z.boolean(),
    message: z.string(),
  }),
  execute: async (inputData) =>
    enrichFromWebsite({
      websiteUrl: inputData.websiteUrl,
      companyName: inputData.companyName,
    }),
});

const checkCompetitorsTool = createTool({
  id: "checkCompetitors",
  description: `Analyse rapide des concurrents mentionnés par l'interlocuteur.

QUAND L'UTILISER :
- Quand l'interlocuteur mentionne des concurrents spécifiques
- Maximum 3 concurrents analysés (limite de rapidité)

MODÈLE : Claude Haiku (rapide et économique). Analyse de surface uniquement.`,
  inputSchema: z.object({
    competitorUrls: z.array(z.string().url()).optional().describe("URLs des sites concurrents (max 3 recommandé)"),
    competitorNames: z.array(z.string()).optional().describe("Noms des concurrents sans URL (retournera placeholder)"),
  }),
  outputSchema: z.object({
    competitors: z.array(
      z.object({
        name: z.string(),
        url: z.string().optional(),
        positioning: z.string(),
        channels: z.array(z.string()),
        pricingSignals: z.string(),
      })
    ),
    error: z.string().optional(),
  }),
  execute: async (inputData) =>
    checkCompetitors({
      competitorUrls: inputData.competitorUrls,
      competitorNames: inputData.competitorNames,
    }),
});

const suggestQuestionsTool = createTool({
  id: "suggestQuestions",
  description: `Suggère les prochaines questions pertinentes basées sur le secteur et la progression.

QUAND L'UTILISER :
- Pour guidance contextuelle pendant l'interview
- Quand l'agent a besoin d'inspiration pour approfondir un bloc

SECTEURS SUPPORTÉS : saas, ecommerce, agency, startup, other.
Les questions suggérées sont des guides, pas des scripts rigides.`,
  inputSchema: z.object({
    sector: z
      .enum(["saas", "ecommerce", "agency", "startup", "other"])
      .describe("Secteur de l'entreprise"),
    completedBlocks: z.array(z.number().int()).describe("Numéros des blocs déjà complétés (ex: [1, 2])"),
    currentBlockData: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Données partielles du bloc en cours (optionnel)"),
  }),
  outputSchema: z.object({
    nextQuestions: z.array(z.string()),
    reasoning: z.string(),
  }),
  execute: async (inputData) =>
    suggestQuestions({
      sector: inputData.sector,
      completedBlocks: inputData.completedBlocks,
      currentBlockData: inputData.currentBlockData,
    }),
});

const signalInterviewCompleteTool = createTool({
  id: "signal_interview_complete",
  description:
    "Appelle cet outil quand l'entretien de découverte est terminé et que tu as couvert les 4 blocs (problème/proposition de valeur, audiences, marketing actuel, contexte business). Appelle-le en même temps que ton message de clôture.",
  inputSchema: z.object({}),
  outputSchema: z.object({ acknowledged: z.boolean() }),
  execute: async () => ({ acknowledged: true }),
});

const presentChoicesTool = createTool({
  id: "present_choices",
  description:
    "Utilise cet outil quand tu poses une question à choix fermés (ex: secteur d'activité, niveau d'urgence). Au lieu d'écrire les options dans ton message texte, appelle cet outil pour afficher une interface de sélection claire. N'inclus PAS les options dans ton texte. Tu peux écrire un court texte d'introduction avant d'appeler l'outil.",
  inputSchema: z.object({
    question: z.string().describe("La question posée à l'utilisateur"),
    choices: z
      .array(
        z.object({
          value: z.string().describe("Identifiant technique du choix (ex: saas)"),
          label: z.string().describe("Libellé affiché (ex: SaaS)"),
          description: z.string().optional().describe("Description courte optionnelle"),
        })
      )
      .describe("Les options proposées"),
  }),
  outputSchema: z.object({ presented: z.boolean() }),
  execute: async () => ({ presented: true }),
});

export const discoveryTools = {
  saveDiscoveryBlock: saveDiscoveryBlockTool,
  enrichFromWebsite: enrichFromWebsiteTool,
  checkCompetitors: checkCompetitorsTool,
  suggestQuestions: suggestQuestionsTool,
  signal_interview_complete: signalInterviewCompleteTool,
  present_choices: presentChoicesTool,
};
