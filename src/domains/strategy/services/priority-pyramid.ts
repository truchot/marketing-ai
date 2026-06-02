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

// ------------------------------------------------------------
// Detail — the actual data an organization has stored for each item.
// Powers the "tap a chip to see what's stored" interaction.
// ------------------------------------------------------------
export interface PyramidItemField {
  label: string;
  values: string[];
}

export interface PyramidItemDetail {
  fields: PyramidItemField[];
  /** Set when there is nothing to show (untracked, or tracked-but-empty). */
  note?: string;
}

/** Build a field, dropping empty/blank values. Returns null when nothing remains. */
function field(label: string, value: string | (string | undefined | null)[]): PyramidItemField | null {
  const raw = Array.isArray(value) ? value : [value];
  const values = raw.map((v) => (v ?? "").trim()).filter((v) => v !== "");
  return values.length > 0 ? { label, values } : null;
}

function fields(...items: (PyramidItemField | null)[]): PyramidItemField[] {
  return items.filter((f): f is PyramidItemField => f !== null);
}

/** Per-item extractors of the stored data, keyed by item id (tracked items only). */
const DETAIL_EXTRACTORS: Record<string, (s: MarketingStrategy) => PyramidItemField[]> = {
  "precise-icp": (s) => {
    const icp = s.strategic.targetMarket.icp;
    return fields(
      field("Description", icp.description),
      field("Pain points", icp.painPoints),
      field("Trigger moments", icp.triggerMoments),
      field("Buying context", icp.buyingContext),
      field("Preferred channels", icp.preferredChannels),
      field("Common objections", icp.commonObjections),
      field("Decision criteria", icp.decisionCriteria)
    );
  },
  "market-research": (s) => {
    const tm = s.strategic.targetMarket;
    return fields(
      field("Market definition", tm.marketDefinition),
      field(
        "Segments",
        tm.segments.map((seg) => `${seg.segment} (${seg.priority}) — ${seg.mainPain}`)
      )
    );
  },
  "strong-value-proposition": (s) => {
    const bs = s.strategic.businessStrategy;
    return fields(
      field("Value proposition", bs.valueProposition),
      field("Transformation", `${bs.transformation.before} → ${bs.transformation.after}`),
      field("Time to value", bs.transformation.timeToValue)
    );
  },
  "unique-selling-point": (s) => {
    const bs = s.strategic.businessStrategy;
    return fields(
      field("Differentiator", bs.uniqueDifferentiator),
      field("Competitive angle", bs.competitiveAngle)
    );
  },
  "clear-positioning": (s) => {
    const p = s.strategic.marketingFoundation.positioning;
    return fields(
      field("Target market", p.targetMarket),
      field("Unique value", p.uniqueValue),
      field("Competitive angle", p.competitiveAngle),
      field("Brand personality", p.brandPersonality)
    );
  },
  "consistent-messaging": (s) => {
    const m = s.strategic.marketingFoundation.messaging;
    return fields(
      field("Primary message", m.primaryMessage),
      field(
        "Segment messages",
        m.segmentMessages.map((sm) => `${sm.segment}: ${sm.message} (${sm.tone})`)
      ),
      field("Proof points", m.proofPoints)
    );
  },
  offers: (s) => fields(field("Offer", s.strategic.marketingFoundation.offer)),
  "brand-narrative": (s) =>
    fields(
      field("Narrative", s.narrativeSummary),
      field("Vision", s.strategic.businessStrategy.vision)
    ),
  "feedback-loop": (s) => {
    const fl = s.strategic.feedbackLoop;
    return fields(
      field("Hypotheses", fl.hypotheses),
      field(
        "Validation tests",
        fl.validationTests.map((t) => `${t.hypothesis} — ${t.metric} (${t.status})`)
      ),
      field("Review cadence", fl.reviewCadence),
      field("Pivot triggers", fl.pivotTriggers)
    );
  },
  "marketing-discipline": (s) =>
    fields(
      field("Review cadence", s.strategic.feedbackLoop.reviewCadence),
      field(
        "Processes",
        s.tactical.marketingSystem.processes.map((p) => `${p.name} (${p.frequency})`)
      )
    ),
  "content-systems": (s) =>
    fields(
      field(
        "Content pillars",
        s.tactical.marketingPlan.contentPlan.map(
          (c) => `${c.pillar} — ${c.themes.join(", ")} [${c.cadence}]`
        )
      )
    ),
  "repurposing-workflows": (s) =>
    fields(
      field(
        "Automations",
        s.tactical.marketingSystem.automations.map((a) => `${a.name}: ${a.trigger} → ${a.action}`)
      )
    ),
  "warm-outbound": (s) =>
    fields(
      field(
        "Acquisition channels",
        s.tactical.marketingPlan.channelStrategy
          .filter((c) => c.role === "acquisition")
          .map((c) => `${c.channel} — ${c.frequency}`)
      )
    ),
  "allbound-approach": (s) =>
    fields(
      field("Inbound pillars", s.tactical.marketingPlan.contentPlan.map((c) => c.pillar)),
      field(
        "Outbound channels",
        s.tactical.marketingPlan.channelStrategy
          .filter((c) => c.role === "acquisition")
          .map((c) => c.channel)
      )
    ),
};

const UNTRACKED_NOTE: Record<PriorityTier, string> = {
  foundation: "Not tracked yet.",
  leverage: "Not modeled yet — capturing this is a planned follow-up.",
  surface: "Surface noise — intentionally not optimized for.",
};

/** Extract the stored data for an item, or a note explaining why there's none. */
export function getItemDetail(item: PyramidItem, strategy: MarketingStrategy): PyramidItemDetail {
  if (!item.tracked) return { fields: [], note: UNTRACKED_NOTE[item.tier] };
  const extracted = DETAIL_EXTRACTORS[item.id]?.(strategy) ?? [];
  if (extracted.length === 0) {
    return { fields: [], note: "No data stored for this item yet." };
  }
  return { fields: extracted };
}

export type ItemStatus = "covered" | "missing" | "untracked";

export interface PyramidItemAssessment {
  id: string;
  label: string;
  tier: PriorityTier;
  status: ItemStatus;
  /** The stored data backing this item (or a note when there's none). */
  detail: PyramidItemDetail;
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
      detail: getItemDetail(i, strategy),
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
