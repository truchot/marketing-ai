// ============================================================
// Competitor Intelligence → Confidence
// Feeds the `confidence` dimension of an experiment's ICE score
// from real market signals (competitor angles + gaps).
// See docs/adr/0001-bounded-context-experimentation.md
// ============================================================

import {
  fetchAndCleanHtml,
  callClaudeHaiku,
  extractJsonFromResponse,
} from "@/tools/discovery/index";
import type { ConfidenceSource } from "@/types/experiment";

// ============================================================
// Types
// ============================================================

export interface MarketAngle {
  angle: string; // dominant marketing message ("gain de temps", "peur de l'erreur")
  prevalence: number; // how many analyzed competitors use it
}

export interface CompetitorIntel {
  analyzed: string[]; // urls successfully analyzed
  angles: MarketAngle[]; // dominant angles observed across competitors
  gaps: string[]; // angles NOT exploited by competitors (opportunities)
}

const MAX_COMPETITORS = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================
// Pure helpers (testable without network / LLM)
// ============================================================

/**
 * Map competitor intelligence to confidence sources (the audit trail behind
 * an experiment's confidence). One source per observed angle, plus one for the
 * gaps when present.
 */
export function toConfidenceSources(intel: CompetitorIntel): ConfidenceSource[] {
  const total = intel.analyzed.length;
  const sources: ConfidenceSource[] = intel.angles.map((a) => ({
    type: "competitor_intel",
    evidence: `Angle "${a.angle}" present chez ${a.prevalence}/${total || "?"} concurrents analyses`,
  }));

  if (intel.gaps.length > 0) {
    sources.push({
      type: "competitor_intel",
      evidence: `Gaps non exploites par les concurrents : ${intel.gaps.join(", ")}`,
    });
  }

  return sources;
}

/**
 * Derive a confidence score (1-10) from how data-informed the bet is.
 * Heuristic (documented in ADR-0001):
 *  - no first-hand intel → 3 (cold start, benchmark-only territory)
 *  - base 4 + up to +3 for observed angles (proven demand signal)
 *  - +1 when a clear gap exists to exploit
 */
export function deriveConfidence(intel: CompetitorIntel): number {
  if (intel.analyzed.length === 0) {
    return 3;
  }
  const angleSignal = Math.min(intel.angles.length, 3);
  const gapSignal = intel.gaps.length > 0 ? 1 : 0;
  return clamp(4 + angleSignal + gapSignal, 1, 10);
}

/** Build the extraction prompt comparing several competitor pages. */
export function buildCompetitorAnglesPrompt(
  pages: Array<{ url: string; text: string }>,
  sector?: string
): string {
  const corpus = pages
    .map((p, i) => `=== CONCURRENT ${i + 1} (${p.url}) ===\n${p.text}`)
    .join("\n\n");

  return `Tu es un analyste marketing. Compare ces pages de concurrents${
    sector ? ` du secteur "${sector}"` : ""
  } et identifie les angles marketing dominants et les angles sous-exploites.

Reponds UNIQUEMENT en JSON strict (pas de markdown) :
{
  "angles": [
    { "angle": "message marketing recurrent en 2-4 mots", "prevalence": nombre_de_concurrents_qui_l_utilisent }
  ],
  "gaps": ["angle pertinent qu'aucun (ou peu) de concurrents n'exploite"]
}

Maximum 5 angles et 3 gaps. Sois concis et concret.

${corpus}`;
}

// ============================================================
// SDK-backed analysis (isolated boundary)
// ============================================================

export interface AnalyzeCompetitorAnglesInput {
  competitorUrls: string[];
  sector?: string;
}

/**
 * Fetch competitor homepages and extract the dominant marketing angles + gaps
 * via Claude Haiku. Returns structured intel ready to feed confidence.
 * Resilient: pages that fail to fetch are skipped.
 */
export async function analyzeCompetitorAngles(
  input: AnalyzeCompetitorAnglesInput
): Promise<CompetitorIntel> {
  const urls = input.competitorUrls.slice(0, MAX_COMPETITORS);

  const fetched = await Promise.all(
    urls.map(async (url) => {
      try {
        const text = await fetchAndCleanHtml(url, 6000);
        return { url, text };
      } catch {
        return null;
      }
    })
  );
  const pages = fetched.filter((p): p is { url: string; text: string } => p !== null);

  if (pages.length === 0) {
    return { analyzed: [], angles: [], gaps: [] };
  }

  try {
    const responseText = await callClaudeHaiku(
      buildCompetitorAnglesPrompt(pages, input.sector),
      1024
    );
    const parsed = extractJsonFromResponse<{
      angles?: MarketAngle[];
      gaps?: string[];
    }>(responseText);

    return {
      analyzed: pages.map((p) => p.url),
      angles: parsed.angles ?? [],
      gaps: parsed.gaps ?? [],
    };
  } catch {
    // Extraction failed: report the pages we reached but no angles.
    return { analyzed: pages.map((p) => p.url), angles: [], gaps: [] };
  }
}
