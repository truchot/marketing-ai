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
      async (args, _extra) => {
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
      `Enrichit la découverte en analysant le site web de l'entreprise avec Claude Haiku.

QUAND L'UTILISER :
- En début d'entretien si l'URL du site est mentionnée
- Pour préparer des questions plus pertinentes
- Pour identifier les écarts entre "ce que le site dit" et "ce que le dirigeant dit"

ANALYSE EXTRAITE :
- Proposition de valeur visible
- Cibles apparentes
- Canaux marketing visibles (réseaux sociaux, blog, etc.)
- Modèle de pricing (freemium, abonnement, etc.)
- Offres principales
- Messaging clés (mots/phrases récurrents)

TEMPS : ~5-8 secondes
MODÈLE : Claude Haiku (rapide et économique)

IMPORTANT :
- Ne pas bloquer la conversation en attendant le résultat
- Utiliser les insights pour enrichir les questions, pas pour remplacer l'écoute
- L'écart site/discours est souvent révélateur`,
      {
        websiteUrl: z.string().url().describe("URL complète du site web (ex: https://example.com)"),
        companyName: z.string().optional().describe("Nom de l'entreprise (optionnel, améliore l'analyse)"),
      },
      async (args, _extra) => {
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
      async (args, _extra) => {
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
      async (args, _extra) => {
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
  ],
});
