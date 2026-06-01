// ============================================================
// Variant Generation
// Produces several asset variants for a daily action so the bet
// has something to A/B — the "produire des variantes" step.
// ============================================================

import { callClaudeSonnet, extractJsonFromResponse } from "@/tools/discovery/index";
import type { Hypothesis, DailyActionAsset } from "@/types/experiment";

export interface GenerateVariantsInput {
  hypothesis: Hypothesis;
  channel: string;
  brandTone: string;
  format: string; // "linkedin_post", "email", …
  count?: number; // number of variants (default 3)
}

/** Build the variant-generation prompt (pure, testable). */
export function buildVariantsPrompt(input: GenerateVariantsInput): string {
  const count = input.count ?? 3;
  const { hypothesis, channel, brandTone, format } = input;

  return `Tu es un copywriter marketing. Produis ${count} variantes d'un asset pour tester une hypothese.

## Hypothese
On parie que "${hypothesis.belief}" aupres de "${hypothesis.audience}" va generer "${hypothesis.outcome}" (mesure : ${hypothesis.successMetric}, seuil ${hypothesis.threshold}).

## Contraintes
- Canal : ${channel}
- Format : ${format}
- Ton de marque : ${brandTone}
- Chaque variante doit tester un ANGLE distinct (accroche differente), pas une reformulation.

Reponds UNIQUEMENT en JSON strict (pas de markdown) :
{
  "variants": [
    { "format": "${format}", "variantLabel": "hook A", "content": "le contenu pret a publier" }
  ]
}`;
}

/**
 * Generate asset variants via Claude Sonnet (creative task).
 * Returns an empty array if the model output cannot be parsed.
 */
export async function generateVariants(
  input: GenerateVariantsInput
): Promise<DailyActionAsset[]> {
  const responseText = await callClaudeSonnet(buildVariantsPrompt(input));
  try {
    const parsed = extractJsonFromResponse<{ variants?: DailyActionAsset[] }>(responseText);
    return parsed.variants ?? [];
  } catch {
    return [];
  }
}
