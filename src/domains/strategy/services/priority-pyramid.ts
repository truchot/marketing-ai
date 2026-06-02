// ============================================================
// Priority Pyramid — a prioritization lens over a MarketingStrategy
//
// Encodes Pierre Herubel's "2026 Marketing Priorities" pyramid as an
// orthogonal view on the existing 3-layer strategy:
//
//   foundation ("What Never Changes")  — invest here first
//   leverage   ("What Will Really Matter")
//   surface    ("What Will Make Noise") — intentionally NOT optimized for
//
// The foundation tier maps 1:1 onto the existing strategic subsystems
// (targetMarket, businessStrategy, feedbackLoop, marketingFoundation).
// Each *tracked* item carries a pure predicate over MarketingStrategy that
// tells whether the strategy covers it. Surface items — and a few leverage
// items not yet modeled — are marked `tracked: false` and reported as
// "not tracked" rather than missing.
//
// `assessPriorityPyramid` is a PURE function — no I/O, no tokens. It mirrors
// `calculateMaturityScore` and `scoreDiscoveryCompleteness`. See [[mastra-migration]].
// ============================================================

import type { MarketingStrategy } from "@/types/marketing-strategy";

export type PriorityTier = "foundation" | "leverage" | "surface";

/** Human-facing framing for each tier (matches the source infographic). */
export const TIER_FRAMING: Record<PriorityTier, string> = {
  foundation: "What Never Changes",
  leverage: "What Will Really Matter",
  surface: "What Will Make Noise",
};

/** Order from base (most important) to apex (noise). */
export const TIER_ORDER: readonly PriorityTier[] = ["foundation", "leverage", "surface"] as const;

export interface PyramidItem {
  id: string;
  label: string;
  tier: PriorityTier;
  /** False for items the strategy model does not represent (surface noise + unmodeled leverage). */
  tracked: boolean;
  /** Returns true when the strategy covers this item. Only defined for tracked items. */
  covered?: (s: MarketingStrategy) => boolean;
  /** FR/EN keywords used by the text-based foundation-coverage scorer. */
  keywords: string[];
}

const nonEmpty = (v: string | undefined | null): boolean => typeof v === "string" && v.trim() !== "";

// ------------------------------------------------------------
// Catalog — single source of truth for both the assessment and the scorer.
// ------------------------------------------------------------
export const PYRAMID_ITEMS: readonly PyramidItem[] = [
  // --- Foundation ("What Never Changes") — all tracked ---
  {
    id: "precise-icp",
    label: "Precise ICP",
    tier: "foundation",
    tracked: true,
    covered: (s) =>
      nonEmpty(s.strategic.targetMarket.icp.description) &&
      s.strategic.targetMarket.icp.painPoints.length > 0,
    keywords: ["icp", "client idéal", "ideal customer", "persona", "cible précise"],
  },
  {
    id: "market-research",
    label: "Market Research",
    tier: "foundation",
    tracked: true,
    covered: (s) =>
      nonEmpty(s.strategic.targetMarket.marketDefinition) &&
      s.strategic.targetMarket.segments.length > 0,
    keywords: ["marché", "market research", "segment", "étude de marché"],
  },
  {
    id: "strong-value-proposition",
    label: "Strong Value Proposition",
    tier: "foundation",
    tracked: true,
    covered: (s) => nonEmpty(s.strategic.businessStrategy.valueProposition),
    keywords: ["proposition de valeur", "value proposition", "valeur"],
  },
  {
    id: "unique-selling-point",
    label: "Unique Selling Point",
    tier: "foundation",
    tracked: true,
    covered: (s) => nonEmpty(s.strategic.businessStrategy.uniqueDifferentiator),
    keywords: ["différenciateur", "differentiator", "usp", "unique selling"],
  },
  {
    id: "clear-positioning",
    label: "Clear positioning",
    tier: "foundation",
    tracked: true,
    covered: (s) =>
      nonEmpty(s.strategic.marketingFoundation.positioning.uniqueValue) &&
      nonEmpty(s.strategic.marketingFoundation.positioning.targetMarket),
    keywords: ["positionnement", "positioning"],
  },
  {
    id: "consistent-messaging",
    label: "Consistent Messaging",
    tier: "foundation",
    tracked: true,
    covered: (s) => nonEmpty(s.strategic.marketingFoundation.messaging.primaryMessage),
    keywords: ["message", "messaging", "discours"],
  },
  {
    id: "offers",
    label: "Offers",
    tier: "foundation",
    tracked: true,
    covered: (s) => nonEmpty(s.strategic.marketingFoundation.offer),
    keywords: ["offre", "offer", "packaging"],
  },
  {
    id: "brand-narrative",
    label: "Brand narrative",
    tier: "foundation",
    tracked: true,
    covered: (s) => nonEmpty(s.narrativeSummary) || nonEmpty(s.strategic.businessStrategy.vision),
    keywords: ["narratif", "narrative", "récit", "vision de marque", "story"],
  },
  {
    id: "feedback-loop",
    label: "Focus on feedback loop",
    tier: "foundation",
    tracked: true,
    covered: (s) => s.strategic.feedbackLoop.hypotheses.length > 0,
    keywords: ["feedback", "boucle de rétroaction", "hypothèse", "validation"],
  },
  {
    id: "marketing-discipline",
    label: "Marketing Discipline",
    tier: "foundation",
    tracked: true,
    covered: (s) =>
      nonEmpty(s.strategic.feedbackLoop.reviewCadence) ||
      s.tactical.marketingSystem.processes.length > 0,
    keywords: ["discipline", "cadence", "processus", "process", "rituel"],
  },

  // --- Leverage ("What Will Really Matter") — partially tracked ---
  {
    id: "content-systems",
    label: "Content systems",
    tier: "leverage",
    tracked: true,
    covered: (s) => s.tactical.marketingPlan.contentPlan.length > 0,
    keywords: ["content system", "système de contenu", "pilier de contenu"],
  },
  {
    id: "repurposing-workflows",
    label: "Repurposing workflows",
    tier: "leverage",
    tracked: true,
    covered: (s) => s.tactical.marketingSystem.automations.length > 0,
    keywords: ["repurposing", "réemploi", "workflow", "automation"],
  },
  {
    id: "warm-outbound",
    label: "Warm Outbound",
    tier: "leverage",
    tracked: true,
    covered: (s) =>
      s.tactical.marketingPlan.channelStrategy.some((c) => c.role === "acquisition"),
    keywords: ["outbound", "prospection", "acquisition"],
  },
  {
    id: "allbound-approach",
    label: "Allbound Approach",
    tier: "leverage",
    tracked: true,
    covered: (s) =>
      s.tactical.marketingPlan.contentPlan.length > 0 &&
      s.tactical.marketingPlan.channelStrategy.some((c) => c.role === "acquisition"),
    keywords: ["allbound", "inbound", "outbound combiné"],
  },
  // Leverage items the strategy model does not represent yet (follow-up).
  { id: "intent-signals", label: "Intent Signals", tier: "leverage", tracked: false, keywords: ["intent", "signaux d'intention"] },
  { id: "personal-brands", label: "Personal Brands", tier: "leverage", tracked: false, keywords: ["personal brand", "marque personnelle"] },
  { id: "partnerships-collabs", label: "Partnerships & Collabs", tier: "leverage", tracked: false, keywords: ["partenariat", "partnership", "collab"] },
  { id: "sales-content-alignment", label: "Sales + content alignment", tier: "leverage", tracked: false, keywords: ["alignement sales", "sales alignment"] },

  // --- Surface ("What Will Make Noise") — intentionally untracked ---
  { id: "new-trends", label: "New Trends", tier: "surface", tracked: false, keywords: ["tendance", "trend"] },
  { id: "ai-automations", label: "AI automations", tier: "surface", tracked: false, keywords: ["ai automation", "automatisation ia"] },
  { id: "marketing-hacks", label: "Marketing Hacks", tier: "surface", tracked: false, keywords: ["hack", "growth hack"] },
  { id: "new-tools", label: "New tools", tier: "surface", tracked: false, keywords: ["nouvel outil", "new tool"] },
  { id: "shiny-tool-stacks", label: "Shiny Tool stacks", tier: "surface", tracked: false, keywords: ["tool stack", "stack d'outils"] },
  { id: "virality", label: "Virality", tier: "surface", tracked: false, keywords: ["viralité", "virality", "viral"] },
] as const;

/** Canonical list of foundation items, used by the scorer and the assessment. */
export const FOUNDATION_ITEMS = PYRAMID_ITEMS.filter((i) => i.tier === "foundation");

export type ItemStatus = "covered" | "missing" | "untracked";

export interface PyramidItemAssessment {
  id: string;
  label: string;
  tier: PriorityTier;
  status: ItemStatus;
}

export interface TierAssessment {
  tier: PriorityTier;
  framing: string;
  items: PyramidItemAssessment[];
  /** Number of tracked items in this tier. */
  trackedCount: number;
  /** Number of tracked items that are covered. */
  coveredCount: number;
}

/** A strategy is "foundation-first" when its base is solid; "fragile" when it is not. */
export type PyramidVerdict = "foundation-first" | "building" | "fragile";

export interface PyramidAssessment {
  tiers: TierAssessment[];
  /** 0-100 — proportion of foundation items covered. */
  foundationFirstScore: number;
  verdict: PyramidVerdict;
  /** True when the base is too weak to safely invest in higher tiers. */
  noiseRisk: boolean;
}

function statusOf(item: PyramidItem, strategy: MarketingStrategy): ItemStatus {
  if (!item.tracked || !item.covered) return "untracked";
  return item.covered(strategy) ? "covered" : "missing";
}

function verdictOf(score: number): PyramidVerdict {
  if (score >= 80) return "foundation-first";
  if (score >= 50) return "building";
  return "fragile";
}

/**
 * Assess a strategy against the priority pyramid.
 * Pure function — deterministic, no side effects.
 */
export function assessPriorityPyramid(strategy: MarketingStrategy): PyramidAssessment {
  const tiers: TierAssessment[] = TIER_ORDER.map((tier) => {
    const items = PYRAMID_ITEMS.filter((i) => i.tier === tier).map((i) => ({
      id: i.id,
      label: i.label,
      tier: i.tier,
      status: statusOf(i, strategy),
    }));
    const trackedCount = items.filter((i) => i.status !== "untracked").length;
    const coveredCount = items.filter((i) => i.status === "covered").length;
    return { tier, framing: TIER_FRAMING[tier], items, trackedCount, coveredCount };
  });

  const foundation = tiers.find((t) => t.tier === "foundation")!;
  const foundationFirstScore =
    foundation.trackedCount === 0
      ? 0
      : Math.round((foundation.coveredCount / foundation.trackedCount) * 100);

  return {
    tiers,
    foundationFirstScore,
    verdict: verdictOf(foundationFirstScore),
    noiseRisk: foundationFirstScore < 50,
  };
}
