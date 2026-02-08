// ============================================================
// Discovery Tools Implementation
// Coupled with the existing memory system
// ============================================================

import { query } from "@anthropic-ai/claude-agent-sdk";
import { recordEpisodeUseCase, addClientFactUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";
import { startEnrichmentInBackground } from "./website-enrichment";

// ============================================================
// Tool 1: saveDiscoveryBlock (OBLIGATOIRE)
// ============================================================

interface SaveDiscoveryBlockInput {
  blockNumber: 1 | 2 | 3 | 4;
  blockName: "problem_value" | "audience" | "marketing_landscape" | "business_context";
  data: Partial<BusinessDiscovery>;
  validatedBy: boolean;
}

interface SaveDiscoveryBlockOutput {
  success: boolean;
  message: string;
  episodeId: string;
}

export async function saveDiscoveryBlock(
  input: SaveDiscoveryBlockInput
): Promise<SaveDiscoveryBlockOutput> {
  const { blockNumber, blockName, data, validatedBy } = input;

  const blockNameMap = {
    problem_value: "Problème & Proposition de valeur",
    audience: "Audiences & Segments",
    marketing_landscape: "Paysage marketing actuel",
    business_context: "Objectifs & Contexte business",
  };

  const description = `Bloc ${blockNumber} : ${blockNameMap[blockName]} ${validatedBy ? "(validé)" : "(non validé)"}`;

  const tags = [
    "discovery",
    `block-${blockNumber}`,
    blockName,
    ...(validatedBy ? ["validated"] : []),
  ];

  const importance = validatedBy && blockNumber === 4 ? "high" : validatedBy ? "medium" : "low";

  const result = recordEpisodeUseCase.execute({
    type: "discovery",
    description,
    data: {
      blockNumber,
      blockName,
      validatedBy,
      discoveryData: data,
    },
    tags,
    importance,
  });

  if (result.isErr()) {
    return {
      success: false,
      message: result.error.message,
      episodeId: "",
    };
  }

  const episode = result.value;

  // Optionally enrich semantic memory with key facts if validated
  if (validatedBy && data.metadata?.companyName) {
    const factResult = addClientFactUseCase.execute({
      category: "discovery",
      fact: `${blockNameMap[blockName]} complété pour ${data.metadata.companyName}`,
      source: "discovery_agent",
    });
    if (factResult.isErr()) {
      // Non-blocking: semantic memory enrichment is optional
      console.warn("Could not enrich semantic memory:", factResult.error.message);
    }
  }

  return {
    success: true,
    message: `Bloc ${blockNumber} enregistré avec succès dans la mémoire épisodique.`,
    episodeId: episode.id,
  };
}

// ========== Fonctions utilitaires partagées (exportées) ==========

/**
 * Retire scripts, styles et tags HTML d'une string.
 */
export function cleanHtml(html: string, maxChars: number = 8000): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

/**
 * Fetch et nettoie le contenu HTML d'une URL.
 */
export async function fetchAndCleanHtml(url: string, maxChars: number = 8000): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; DiscoveryBot/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const html = await response.text();
  return cleanHtml(html, maxChars);
}

/**
 * Appelle Claude Haiku via le Claude Agent SDK pour analyser du contenu.
 */
export async function callClaudeHaiku(prompt: string, _maxTokens: number = 1024): Promise<string> {
  const result = query({
    prompt,
    options: {
      model: "claude-haiku-4-5-20251001",
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      maxTurns: 2,
      persistSession: false,
    },
  });

  let text = "";
  for await (const msg of result) {
    if (msg.type === "assistant") {
      for (const block of msg.message.content) {
        if (block.type === "text") {
          text += block.text;
        }
      }
    } else if (msg.type === "result") {
      if (msg.subtype === "success") {
        return text || msg.result;
      }
      console.error("[callClaudeHaiku] Query failed:", msg.subtype, msg.errors);
      throw new Error(`Claude Haiku query failed: ${msg.subtype}${msg.errors?.length ? ` - ${msg.errors.join(", ")}` : ""}`);
    }
  }

  throw new Error("No result from Claude Haiku query");
}

/**
 * Extrait un objet JSON d'une réponse texte de Claude.
 */
export function extractJsonFromResponse<T>(text: string): T {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from Claude response");
  }
  return JSON.parse(jsonMatch[0]) as T;
}

// ============================================================
// Tool 2: enrichFromWebsite (NON-BLOQUANT)
// ============================================================

interface EnrichFromWebsiteInput {
  websiteUrl: string;
  companyName?: string;
}

interface EnrichFromWebsiteOutput {
  started: boolean;
  message: string;
}

export async function enrichFromWebsite(
  input: EnrichFromWebsiteInput
): Promise<EnrichFromWebsiteOutput> {
  startEnrichmentInBackground(input.websiteUrl, input.companyName, addClientFactUseCase);
  return { started: true, message: "Enrichissement lancé en arrière-plan. Les insights seront stockés automatiquement en mémoire." };
}

// ============================================================
// Tool 3: checkCompetitors (OPTIONNEL)
// ============================================================

interface CheckCompetitorsInput {
  competitorUrls?: string[];
  competitorNames?: string[];
}

interface CompetitorAnalysis {
  name: string;
  url?: string;
  positioning: string;
  channels: string[];
  pricingSignals: string;
}

interface CheckCompetitorsOutput {
  competitors: CompetitorAnalysis[];
  error?: string;
}

export async function checkCompetitors(
  input: CheckCompetitorsInput
): Promise<CheckCompetitorsOutput> {
  const { competitorUrls = [], competitorNames = [] } = input;

  if (competitorUrls.length === 0 && competitorNames.length === 0) {
    return {
      competitors: [],
      error: "No competitors provided",
    };
  }

  // Limit to 3 competitors max for speed
  const urlsToCheck = competitorUrls.slice(0, 3);
  const competitors: CompetitorAnalysis[] = [];

  try {
    for (const url of urlsToCheck) {
      try {
        const cleanText = await fetchAndCleanHtml(url, 6000);

        const analysisPrompt = `Analyse rapide de ce concurrent :

1. **Positionnement** : En 1 phrase, comment se positionnent-ils ?
2. **Canaux visibles** : Quels canaux marketing sont évidents ? (max 3)
3. **Signaux pricing** : Gratuit, payant, freemium, custom ? Indice de prix si visible.

Réponds en JSON strict :
{
  "positioning": "...",
  "channels": ["...", "..."],
  "pricingSignals": "..."
}

Contenu :
${cleanText}`;

        const responseText = await callClaudeHaiku(analysisPrompt, 512);
        const parsed = extractJsonFromResponse<{ positioning?: string; channels?: string[]; pricingSignals?: string }>(responseText);

        competitors.push({
          name: new URL(url).hostname,
          url,
          positioning: parsed.positioning || "Inconnu",
          channels: parsed.channels || [],
          pricingSignals: parsed.pricingSignals || "Inconnu",
        });
      } catch {
        competitors.push({
          name: new URL(url).hostname,
          url,
          positioning: "Erreur d'analyse",
          channels: [],
          pricingSignals: "Inconnu",
        });
      }
    }

    // For named competitors without URLs, just return placeholder
    for (const name of competitorNames.slice(0, 3 - competitors.length)) {
      competitors.push({
        name,
        positioning: "URL non fournie - analyse manuelle nécessaire",
        channels: [],
        pricingSignals: "Inconnu",
      });
    }

    return { competitors };
  } catch (error) {
    return {
      competitors: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================
// Tool 4: suggestQuestions (OPTIONNEL - Tool interne)
// ============================================================

import { getQuestionsForBlock } from "@/data/discovery-questions";

interface SuggestQuestionsInput {
  sector: "saas" | "ecommerce" | "agency" | "startup" | "other";
  completedBlocks: number[];
  currentBlockData?: Partial<BusinessDiscovery>;
}

interface SuggestQuestionsOutput {
  nextQuestions: string[];
  reasoning: string;
}

export function suggestQuestions(
  input: SuggestQuestionsInput
): SuggestQuestionsOutput {
  const { sector, completedBlocks } = input;

  const nextBlock = Math.max(...completedBlocks, 0) + 1;

  if (nextBlock > 4) {
    return {
      nextQuestions: [],
      reasoning: "Tous les blocs sont complétés. L'entretien de découverte peut être clôturé.",
    };
  }

  const questions = getQuestionsForBlock(sector, nextBlock as 1 | 2 | 3 | 4);

  const blockNames = {
    1: "Problème & Proposition de valeur",
    2: "Audiences & Segments",
    3: "Paysage marketing actuel",
    4: "Objectifs & Contexte business",
  };

  return {
    nextQuestions: questions,
    reasoning: `Bloc ${nextBlock} (${blockNames[nextBlock as keyof typeof blockNames]}) à explorer. Questions adaptées au secteur ${sector}.`,
  };
}
