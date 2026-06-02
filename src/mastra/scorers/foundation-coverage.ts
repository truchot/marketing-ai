// ============================================================
// Scorer "foundation-coverage": measures how much of the priority pyramid's
// FOUNDATION tier ("What Never Changes") a strategy-agent output covers.
//
// The framing comes from Pierre Herubel's 2026 Marketing Priorities pyramid:
// a strong strategy is foundation-first. This scorer rewards outputs that
// reason about ICP, positioning, messaging, value proposition, feedback loop,
// etc. — and is blind to surface "noise" (trends, hacks, shiny tools).
//
// The scoring logic is a PURE function (scoreFoundationCoverage), testable
// offline without tokens. The foundation catalog is imported from the domain
// (single source of truth). The Mastra scorer wraps it via generateScore.
//
// NB: an LLM-judge variant would use `judge: { model: claudeAgentModel(...) }`
// to respect the OAuth rule (never a direct Anthropic API key). See [[mastra-migration]].
// ============================================================

import { createScorer } from "@mastra/core/evals";
import { FOUNDATION_ITEMS } from "@/domains/strategy/services/priority-pyramid";

/** Foundation concepts the output is expected to cover (from the pyramid catalog). */
export const FOUNDATION_CONCEPTS = FOUNDATION_ITEMS.map((i) => ({
  id: i.id,
  label: i.label,
  // Match the human label too, alongside the catalog keywords.
  keywords: [i.label.toLowerCase(), ...i.keywords],
}));

/**
 * Coverage score in [0,1] = proportion of the foundation concepts detected in
 * the text. Pure function — no external dependency.
 */
export function scoreFoundationCoverage(output: string): number {
  const text = (output ?? "").toLowerCase();
  if (!text) return 0;
  let covered = 0;
  for (const concept of FOUNDATION_CONCEPTS) {
    if (concept.keywords.some((kw) => text.includes(kw))) covered += 1;
  }
  return covered / FOUNDATION_CONCEPTS.length;
}

/** Extract usable text from the scoring run's input/output. */
function extractOutputText(run: unknown): string {
  const r = run as { output?: unknown };
  const out = r.output;
  if (typeof out === "string") return out;
  if (Array.isArray(out)) {
    return out
      .map((m) => (typeof m === "string" ? m : (m as { content?: string })?.content ?? ""))
      .join("\n");
  }
  if (out && typeof out === "object") {
    const o = out as { text?: string; content?: string };
    return o.text ?? o.content ?? JSON.stringify(out);
  }
  return "";
}

export const foundationCoverageScorer = createScorer({
  id: "foundation-coverage",
  name: "foundation-coverage",
  description:
    "Measures the proportion of the priority pyramid's foundation tier (ICP, positioning, messaging, value proposition, offers, feedback loop, brand narrative, market research, discipline) covered by the output. Foundation-first per Herubel's 2026 Marketing Priorities.",
}).generateScore(({ run }) => scoreFoundationCoverage(extractOutputText(run)));
