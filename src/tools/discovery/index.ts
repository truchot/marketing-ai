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

  const episode = recordEpisodeUseCase.execute({
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

  // Optionally enrich semantic memory with key facts if validated
  if (validatedBy && data.metadata?.companyName) {
    try {
      await addClientFactUseCase.execute({
        category: "discovery",
        fact: `${blockNameMap[blockName]} complété pour ${data.metadata.companyName}`,
        source: "discovery_agent",
      });
    } catch (error) {
      // Non-blocking: semantic memory enrichment is optional
      console.warn("Could not enrich semantic memory:", error);
    }
  }

  return {
    success: true,
    message: `Bloc ${blockNumber} enregistré avec succès dans la mémoire épisodique.`,
    episodeId: episode.id,
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
    return {
      valueProposition: null,
      apparentTargets: [],
      visibleChannels: [],
      pricingModel: null,
      offers: [],
      messaging: [],
      error: "ANTHROPIC_API_KEY not configured",
    };
  }

  try {
    // Fetch the homepage
    const response = await fetch(websiteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DiscoveryBot/1.0)",
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Simple text extraction (remove scripts, styles, and HTML tags)
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000); // Limit to ~8k chars to stay efficient

    // Use Claude Haiku for fast analysis via direct API call
    const analysisPrompt = `Analyse cette page web ${companyName ? `de ${companyName}` : ""} et extrais :

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
${cleanText}`;

    const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: analysisPrompt }],
      }),
    });

    if (!apiResponse.ok) {
      throw new Error(`API error: ${apiResponse.status} ${apiResponse.statusText}`);
    }

    const result = await apiResponse.json() as {
      content: Array<{ type: string; text?: string }>;
    };

    const textContent = result.content.find((block: { type: string }) => block.type === "text") as { type: string; text: string } | undefined;
    if (!textContent) {
      throw new Error("No text response from Claude");
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from Claude response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as WebsiteEnrichmentOutput;

    return {
      valueProposition: parsed.valueProposition || null,
      apparentTargets: parsed.apparentTargets || [],
      visibleChannels: parsed.visibleChannels || [],
      pricingModel: parsed.pricingModel || null,
      offers: parsed.offers || [],
      messaging: parsed.messaging || [],
    };
  } catch (error) {
    return {
      valueProposition: null,
      apparentTargets: [],
      visibleChannels: [],
      pricingModel: null,
      offers: [],
      messaging: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
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
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; DiscoveryBot/1.0)",
          },
          signal: AbortSignal.timeout(8000), // 8s timeout per competitor
        });

        if (!response.ok) {
          competitors.push({
            name: new URL(url).hostname,
            url,
            positioning: "Erreur de récupération",
            channels: [],
            pricingSignals: "Inconnu",
          });
          continue;
        }

        const html = await response.text();
        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 6000); // Smaller limit for competitors

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

        const apiResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 512,
            messages: [{ role: "user", content: analysisPrompt }],
          }),
        });

        if (apiResponse.ok) {
          const result = await apiResponse.json() as {
            content: Array<{ type: string; text?: string }>;
          };

          const textContent = result.content.find((block) => block.type === "text") as { type: string; text: string } | undefined;
          if (textContent) {
            const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              competitors.push({
                name: new URL(url).hostname,
                url,
                positioning: parsed.positioning || "Inconnu",
                channels: parsed.channels || [],
                pricingSignals: parsed.pricingSignals || "Inconnu",
              });
            }
          }
        }
      } catch (error) {
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
