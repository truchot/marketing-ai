// ============================================================
// Discovery Tools Implementation
// Coupled with the existing memory system
// ============================================================

import { generateText } from "@/mastra/model/generate-text";
import { recordEpisodeUseCase, addClientFactUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";
import { runEnrichmentAndReturn, type WebsiteInsights } from "./website-enrichment";

// ============================================================
// Tool 1: saveDiscoveryBlock (MANDATORY)
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
    problem_value: "Problem & Value Proposition",
    audience: "Audiences & Segments",
    marketing_landscape: "Current marketing landscape",
    business_context: "Goals & Business Context",
  };

  const description = `Block ${blockNumber}: ${blockNameMap[blockName]} ${validatedBy ? "(validated)" : "(not validated)"}`;

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
      fact: `${blockNameMap[blockName]} completed for ${data.metadata.companyName}`,
      source: "discovery_agent",
    });
    if (factResult.isErr()) {
      // Non-blocking: semantic memory enrichment is optional
      console.warn("Could not enrich semantic memory:", factResult.error.message);
    }
  }

  return {
    success: true,
    message: `Block ${blockNumber} saved successfully to episodic memory.`,
    episodeId: episode.id,
  };
}

// ========== Shared utility functions (exported) ==========

/**
 * Removes scripts, styles and HTML tags from a string.
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
 * Fetches and cleans the HTML content of a URL.
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
 * Calls Claude Sonnet via the Claude Agent SDK adapter to analyze content.
 * Goes through `generateText` (and therefore `claudeAgentModel`) — no direct call to query().
 */
export async function callClaudeSonnet(prompt: string): Promise<string> {
  const text = await generateText("claude-sonnet-4-5-20250929", prompt);
  if (!text) {
    throw new Error("No result from Claude Sonnet");
  }
  return text;
}

/**
 * Calls Claude Haiku via the Claude Agent SDK adapter to analyze content.
 * Goes through `generateText` (and therefore `claudeAgentModel`) — no direct call to query().
 */
export async function callClaudeHaiku(prompt: string, _maxTokens: number = 1024): Promise<string> {
  void _maxTokens;
  const text = await generateText("claude-haiku-4-5-20251001", prompt);
  if (!text) {
    throw new Error("No result from Claude Haiku");
  }
  return text;
}

/**
 * Extracts a JSON object from a Claude text response.
 */
export function extractJsonFromResponse<T>(text: string): T {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from Claude response");
  }
  return JSON.parse(jsonMatch[0]) as T;
}

// ============================================================
// Tool 2: enrichFromWebsite (NON-BLOCKING)
// ============================================================

interface EnrichFromWebsiteInput {
  websiteUrl: string;
  companyName?: string;
}

type AgentFacingInsights = Omit<WebsiteInsights, "technicalSignals" | "socialLinks">;

interface EnrichFromWebsiteOutput {
  success: boolean;
  message: string;
  insights: AgentFacingInsights | null;
}

export async function enrichFromWebsite(
  input: EnrichFromWebsiteInput
): Promise<EnrichFromWebsiteOutput> {
  const insights = await runEnrichmentAndReturn(input.websiteUrl, input.companyName, addClientFactUseCase);
  if (!insights) {
    return {
      success: false,
      message: "The website could not be analyzed. Continue the interview as normal.",
      insights: null,
    };
  }
  // Exclude technicalSignals and socialLinks (internal data, not useful for the agent interview)
  const { technicalSignals: _, socialLinks: __, ...agentInsights } = insights;
  return {
    success: true,
    message: "Website analyzed successfully. Use these insights to pre-fill answers and avoid redundant questions.",
    insights: agentInsights,
  };
}

// ============================================================
// Tool 3: checkCompetitors (OPTIONAL)
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

        const analysisPrompt = `Quick analysis of this competitor:

1. **Positioning**: In 1 sentence, how do they position themselves?
2. **Visible channels**: Which marketing channels are obvious? (max 3)
3. **Pricing signals**: Free, paid, freemium, custom? Price hint if visible.

Respond in strict JSON:
{
  "positioning": "...",
  "channels": ["...", "..."],
  "pricingSignals": "..."
}

Content:
${cleanText}`;

        const responseText = await callClaudeHaiku(analysisPrompt, 512);
        const parsed = extractJsonFromResponse<{ positioning?: string; channels?: string[]; pricingSignals?: string }>(responseText);

        competitors.push({
          name: new URL(url).hostname,
          url,
          positioning: parsed.positioning || "Unknown",
          channels: parsed.channels || [],
          pricingSignals: parsed.pricingSignals || "Unknown",
        });
      } catch {
        competitors.push({
          name: new URL(url).hostname,
          url,
          positioning: "Analysis error",
          channels: [],
          pricingSignals: "Unknown",
        });
      }
    }

    // For named competitors without URLs, just return placeholder
    for (const name of competitorNames.slice(0, 3 - competitors.length)) {
      competitors.push({
        name,
        positioning: "URL not provided - manual analysis required",
        channels: [],
        pricingSignals: "Unknown",
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
// Tool 4: suggestQuestions (OPTIONAL - Internal tool)
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
      reasoning: "All blocks are completed. The discovery interview can be closed.",
    };
  }

  const questions = getQuestionsForBlock(sector, nextBlock as 1 | 2 | 3 | 4);

  const blockNames = {
    1: "Problem & Value Proposition",
    2: "Audiences & Segments",
    3: "Current marketing landscape",
    4: "Goals & Business Context",
  };

  return {
    nextQuestions: questions,
    reasoning: `Block ${nextBlock} (${blockNames[nextBlock as keyof typeof blockNames]}) to explore. Questions tailored to the ${sector} sector.`,
  };
}
