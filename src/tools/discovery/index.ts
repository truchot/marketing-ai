// ============================================================
// Discovery Tools Implementation
// Coupled with the existing memory system
// ============================================================

import { recordEpisodeUseCase, addClientFactUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";

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

// ========== Fonctions utilitaires partagées ==========

/**
 * Retire scripts, styles et tags HTML d'une string.
 */
function cleanHtml(html: string, maxChars: number = 8000): string {
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
async function fetchAndCleanHtml(url: string, maxChars: number = 8000): Promise<string> {
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
 * Appelle Claude Haiku pour analyser du contenu et retourner du JSON.
 */
async function callClaudeHaiku(prompt: string, maxTokens: number = 1024): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!apiResponse.ok) {
    throw new Error(`API error: ${apiResponse.status} ${apiResponse.statusText}`);
  }

  const result = await apiResponse.json() as {
    content: Array<{ type: string; text?: string }>;
  };

  const textContent = result.content.find((block) => block.type === "text") as { type: string; text: string } | undefined;
  if (!textContent) {
    throw new Error("No text response from Claude");
  }

  return textContent.text;
}

/**
 * Extrait un objet JSON d'une réponse texte de Claude.
 */
function extractJsonFromResponse<T>(text: string): T {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from Claude response");
  }
  return JSON.parse(jsonMatch[0]) as T;
}

/**
 * Construit le prompt d'analyse de site web.
 */
function buildWebsiteAnalysisPrompt(content: string, companyName?: string): string {
  return `Analyse cette page web ${companyName ? `de ${companyName}` : ""} et extrais :

1. **Proposition de valeur** : En 1-2 phrases, quelle transformation promettent-ils ?
2. **Cibles apparentes** : Quels segments de clientèle sont visés ? (max 3)
3. **Canaux visibles** : Quels canaux marketing sont mentionnés ou évidents ? (réseaux sociaux, blog, webinaires, etc.)
4. **Modèle de pricing** : Gratuit, freemium, abonnement, one-time, custom, ou inconnu ?
5. **Offres** : Quels produits/services principaux sont proposés ? (max 3)
6. **Messaging clés** : Quels mots/phrases marketing reviennent ? (max 5)

Réponds en JSON strict :
{
  "valueProposition": "...",
  "apparentTargets": ["...", "..."],
  "visibleChannels": ["...", "..."],
  "pricingModel": "...",
  "offers": ["...", "..."],
  "messaging": ["...", "..."]
}

Contenu de la page :
${content}`;
}

/**
 * Retourne un résultat d'enrichissement vide avec un message d'erreur.
 */
function emptyEnrichmentResult(errorMessage: string): WebsiteEnrichmentOutput {
  return {
    valueProposition: null,
    apparentTargets: [],
    visibleChannels: [],
    pricingModel: null,
    offers: [],
    messaging: [],
    error: errorMessage,
  };
}

// ============================================================
// Tool 2: enrichFromWebsite (RECOMMANDÉ)
// ============================================================

interface EnrichFromWebsiteInput {
  websiteUrl: string;
  companyName?: string;
}

interface WebsiteEnrichmentOutput {
  valueProposition: string | null;
  apparentTargets: string[];
  visibleChannels: string[];
  pricingModel: string | null;
  offers: string[];
  messaging: string[];
  error?: string;
}

export async function enrichFromWebsite(
  input: EnrichFromWebsiteInput
): Promise<WebsiteEnrichmentOutput> {
  const { websiteUrl, companyName } = input;

  if (!process.env.ANTHROPIC_API_KEY) {
    return emptyEnrichmentResult("ANTHROPIC_API_KEY not configured");
  }

  try {
    const cleanContent = await fetchAndCleanHtml(websiteUrl);
    const prompt = buildWebsiteAnalysisPrompt(cleanContent, companyName);
    const responseText = await callClaudeHaiku(prompt);
    const parsed = extractJsonFromResponse<WebsiteEnrichmentOutput>(responseText);

    return {
      valueProposition: parsed.valueProposition || null,
      apparentTargets: parsed.apparentTargets || [],
      visibleChannels: parsed.visibleChannels || [],
      pricingModel: parsed.pricingModel || null,
      offers: parsed.offers || [],
      messaging: parsed.messaging || [],
    };
  } catch (error) {
    return emptyEnrichmentResult(error instanceof Error ? error.message : "Unknown error");
  }
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      competitors: [],
      error: "ANTHROPIC_API_KEY not configured",
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
