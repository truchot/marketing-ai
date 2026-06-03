// ============================================================
// Marketing Problem Assessment ("16 Common Marketing Problems")
// Deterministic, discovery-driven scoring of the 16 named marketing
// problems on the 5-band difficulty-to-solve scale.
//
// Mirrors the per-dimension style of maturity-score.ts: one small pure
// helper per problem, no LLM, no side effects. Problems the discovery
// data cannot judge are flagged `dataSufficiency: "insufficient"` rather
// than guessed — the LLM refinement pass (see diagnostic.ts) may then
// fill those in, but is explicitly allowed to leave them insufficient.
// ============================================================

import type { BusinessDiscovery } from "@/types/business-discovery";
import type {
  ProblemAssessment,
  ProblemKey,
  ProblemSeverity,
} from "@/types/marketing-strategy";

/** The parts of a ProblemAssessment a per-problem assessor computes. */
type ProblemSignal = Omit<ProblemAssessment, "key" | "label" | "isStrategic">;

interface CatalogEntry {
  key: ProblemKey;
  label: string;
  isStrategic: boolean;
  assess: (d: BusinessDiscovery) => ProblemSignal;
}

const SEVERITIES: ReadonlySet<ProblemSeverity> = new Set([
  "easily_fixed",
  "normal",
  "problematic",
  "deep",
  "critical",
]);

function truncate(s: string, max = 80): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/** Default signal for problems discovery cannot measure — honest, not guessed. */
function insufficient(subject: string, recommendation: string): ProblemSignal {
  return {
    severity: "normal",
    evidence: `Insufficient data — ${subject} is not captured by discovery.`,
    recommendation,
    confidence: "low",
    dataSufficiency: "insufficient",
  };
}

// ─── The 16 problems ───────────────────────────────────────

export const PROBLEM_CATALOG: readonly CatalogEntry[] = [
  {
    key: "outdated_tactics",
    label: "Using outdated marketing tactics",
    isStrategic: false,
    assess: (d) => {
      const channels = d.currentMarketing.channels.length;
      const abandoned = d.currentMarketing.abandonedChannels.length;
      const inactiveTools = d.currentMarketing.tools.filter((t) => t.maturity === "inactive").length;
      const severity: ProblemSeverity =
        channels === 0 || inactiveTools >= 2 ? "problematic" : "normal";
      return {
        severity,
        evidence: `${channels} active channel(s), ${abandoned} abandoned, ${inactiveTools} inactive tool(s).`,
        recommendation: "Audit current tactics; retire inactive tools and refresh underperforming channels.",
        confidence: "low",
        dataSufficiency: "inferred",
      };
    },
  },
  {
    key: "unclear_messaging",
    label: "Messaging is unclear or not appealing",
    isStrategic: false,
    assess: (d) => {
      const { before, after } = d.valueProposition.transformation;
      const hasTransformation = before.trim().length > 0 && after.trim().length > 0;
      const proof = d.valueProposition.proofPoints.length;
      const severity: ProblemSeverity = !hasTransformation
        ? "problematic"
        : proof === 0
          ? "normal"
          : "easily_fixed";
      return {
        severity,
        evidence: `Transformation ${hasTransformation ? "articulated" : "missing"}, ${proof} proof point(s).`,
        recommendation: "Sharpen the before→after transformation and back it with concrete proof points.",
        confidence: "medium",
        dataSufficiency: "measured",
      };
    },
  },
  {
    key: "undefined_audience",
    label: "The target audience is not properly defined",
    isStrategic: true,
    assess: (d) => {
      const count = d.audiences.length;
      const hasPrimary = d.audiences.some((a) => a.priority === "primary");
      const primary = d.audiences.find((a) => a.priority === "primary") ?? d.audiences[0];
      const rich = Boolean(
        primary && primary.language.length > 0 && primary.triggerMoment.trim().length > 0
      );
      const severity: ProblemSeverity =
        count === 0 ? "critical" : !hasPrimary ? "deep" : !rich ? "problematic" : "easily_fixed";
      return {
        severity,
        evidence: `${count} segment(s) defined, primary=${hasPrimary}, ICP depth=${rich ? "rich" : "thin"}.`,
        recommendation:
          severity === "critical" || severity === "deep"
            ? "Define and prioritize a primary ICP with real trigger moments and the language they use."
            : "Deepen ICP detail (buying context, objections, decision criteria).",
        confidence: "high",
        dataSufficiency: "measured",
      };
    },
  },
  {
    key: "weak_product",
    label: "The product is not good enough",
    isStrategic: true,
    assess: () =>
      insufficient(
        "product quality",
        "Gather product feedback (NPS, churn reasons, win/loss) before drawing conclusions."
      ),
  },
  {
    key: "poor_measurement",
    label: "Performance measurement is not pertinent",
    isStrategic: false,
    assess: (d) => {
      const hasMetric = d.businessContext.primaryGoal.metric !== null;
      const ueKnown = d.unitEconomics.knowledgeLevel !== "none";
      const severity: ProblemSeverity = !hasMetric && !ueKnown ? "deep" : !hasMetric ? "problematic" : "easily_fixed";
      return {
        severity,
        evidence: `Primary-goal metric ${hasMetric ? "defined" : "missing"}, unit-economics knowledge: ${d.unitEconomics.knowledgeLevel}.`,
        recommendation: "Define measurable goals and instrument KPIs (CAC, conversion, pipeline).",
        confidence: "high",
        dataSufficiency: "measured",
      };
    },
  },
  {
    key: "wrong_talents",
    label: "Not the right talents in the team",
    isStrategic: false,
    assess: (d) => {
      const { size, dedicatedToMarketing, skills, gaps } = d.currentMarketing.team;
      const severity: ProblemSeverity =
        size === 0
          ? "deep"
          : gaps.length === 0
            ? "easily_fixed"
            : gaps.length >= Math.max(1, skills.length)
              ? "deep"
              : "problematic";
      return {
        severity,
        evidence: `Team size ${size}, ${skills.length} skill(s), ${gaps.length} gap(s), dedicated=${dedicatedToMarketing}.`,
        recommendation: "Close the identified skill gaps via hiring, training, or outsourcing.",
        confidence: "high",
        dataSufficiency: "measured",
      };
    },
  },
  {
    key: "standard_positioning",
    label: "Positioning is too standard, no differentiation",
    isStrategic: true,
    assess: (d) => {
      const diff = d.valueProposition.uniqueDifferentiator.trim();
      // Empty differentiator is a hard measured signal; a present one cannot be
      // judged "too standard" deterministically — leave it to the LLM pass.
      if (diff.length === 0) {
        return {
          severity: "critical",
          evidence: "No unique differentiator captured.",
          recommendation: "Articulate a sharp, contrarian differentiator vs. the category norm.",
          confidence: "high",
          dataSufficiency: "measured",
        };
      }
      return {
        severity: "normal",
        evidence: `Differentiator: "${truncate(diff)}".`,
        recommendation: "Pressure-test whether the differentiator is genuinely distinct from competitors.",
        confidence: "low",
        dataSufficiency: "inferred",
      };
    },
  },
  {
    key: "painless_problem",
    label: "The problem solved is not painful enough",
    isStrategic: true,
    assess: (d) => {
      const pain = d.problem.painLevel;
      const severity: ProblemSeverity =
        pain === "irritant" ? "critical" : pain === "bloquant" ? "problematic" : "easily_fixed";
      return {
        severity,
        evidence: `Pain level reported as "${pain}".`,
        recommendation:
          pain === "critique"
            ? "Pain is strong — lead with it in messaging and qualification."
            : "Re-anchor on a more acute, urgent pain or a higher-stakes use case.",
        confidence: "high",
        dataSufficiency: "measured",
      };
    },
  },
  {
    key: "insufficient_content",
    label: "Not enough marketing content",
    isStrategic: false,
    assess: (d) => {
      const channels = d.currentMarketing.channels;
      const organic = channels.filter((c) => c.type === "organic").length;
      const severity: ProblemSeverity =
        channels.length <= 1 ? "problematic" : organic === 0 ? "normal" : "easily_fixed";
      return {
        severity,
        evidence: `${channels.length} active channel(s), ${organic} organic/content channel(s).`,
        recommendation: "Build a consistent content engine on the best-performing channel.",
        confidence: "low",
        dataSufficiency: "inferred",
      };
    },
  },
  {
    key: "imperfect_pricing",
    label: "Pricing is not perfect",
    isStrategic: false,
    assess: (d) => {
      const ratio = d.unitEconomics.ltvCacRatio;
      if (ratio === null) {
        return {
          severity: "normal",
          evidence: `Unit-economics knowledge: ${d.unitEconomics.knowledgeLevel} (LTV/CAC unknown).`,
          recommendation: "Measure LTV/CAC and payback before tuning pricing and packaging.",
          confidence: "low",
          dataSufficiency: "inferred",
        };
      }
      const severity: ProblemSeverity = ratio < 1 ? "deep" : ratio < 3 ? "problematic" : "easily_fixed";
      return {
        severity,
        evidence: `LTV/CAC ratio = ${ratio}.`,
        recommendation: "Tune pricing/packaging to improve LTV/CAC and shorten CAC payback.",
        confidence: "high",
        dataSufficiency: "measured",
      };
    },
  },
  {
    key: "inconsistent_efforts",
    label: "No consistency and patience in efforts",
    isStrategic: false,
    assess: (d) => {
      const abandoned = d.currentMarketing.abandonedChannels.length;
      const severity: ProblemSeverity = abandoned >= 2 ? "problematic" : "normal";
      return {
        severity,
        evidence: `${abandoned} channel(s) tried and abandoned.`,
        recommendation: "Commit to fewer channels with a sustained cadence before judging results.",
        confidence: "low",
        dataSufficiency: "inferred",
      };
    },
  },
  {
    key: "guesswork",
    label: "Too many assumptions and guesswork",
    isStrategic: false,
    assess: (d) => {
      const knowledge = d.unitEconomics.knowledgeLevel;
      const hyp = d.strategicHypotheses.length;
      const severity: ProblemSeverity =
        knowledge === "none" ? "problematic" : knowledge === "basic" ? "normal" : "easily_fixed";
      return {
        severity,
        evidence: `Unit-economics knowledge: ${knowledge}, ${hyp} strategic hypothesis(es) noted.`,
        recommendation: "Replace assumptions with tracked metrics and explicit, testable hypotheses.",
        confidence: "medium",
        dataSufficiency: "measured",
      };
    },
  },
  {
    key: "bad_creative",
    label: "Creative work (copy and design) is bad",
    isStrategic: false,
    assess: () =>
      insufficient(
        "creative quality",
        "Review recent copy/design samples against best-in-class references."
      ),
  },
  {
    key: "poor_systems",
    label: "Systems and processes are not good",
    isStrategic: false,
    assess: (d) => {
      const tools = d.currentMarketing.tools;
      const wellConfigured = tools.filter((t) => t.maturity === "well_configured").length;
      const inactive = tools.filter((t) => t.maturity === "inactive").length;
      const severity: ProblemSeverity =
        tools.length === 0
          ? "problematic"
          : inactive > wellConfigured
            ? "deep"
            : wellConfigured >= 1 && inactive === 0
              ? "easily_fixed"
              : "normal";
      return {
        severity,
        evidence: `${tools.length} tool(s): ${wellConfigured} well-configured, ${inactive} inactive.`,
        recommendation: "Consolidate the stack; activate or drop inactive tools and document processes.",
        confidence: "medium",
        dataSufficiency: "measured",
      };
    },
  },
  {
    key: "rough_sales",
    label: "Sales process is not smooth",
    isStrategic: false,
    assess: (d) => {
      const pipelineTracked = d.unitEconomics.qualifiedRevenuePipeline.tracked;
      const severity: ProblemSeverity = pipelineTracked ? "normal" : "problematic";
      return {
        severity,
        evidence: `Qualified revenue pipeline tracked: ${pipelineTracked}.`,
        recommendation: "Define a clear lead→deal pipeline with stages and a marketing→sales handoff.",
        confidence: "low",
        dataSufficiency: "inferred",
      };
    },
  },
  {
    key: "no_innovation",
    label: "No innovation and stuck in the past",
    isStrategic: false,
    assess: () =>
      insufficient(
        "innovation posture",
        "Allocate a recurring experiment budget for new channels and formats."
      ),
  },
] as const;

// ─── Public API ────────────────────────────────────────────

/**
 * Deterministically assess all 16 marketing problems from discovery data.
 * Pure and side-effect free. Always returns exactly 16 assessments.
 */
export function assessMarketingProblems(discovery: BusinessDiscovery): ProblemAssessment[] {
  return PROBLEM_CATALOG.map((entry) => ({
    key: entry.key,
    label: entry.label,
    isStrategic: entry.isStrategic,
    ...entry.assess(discovery),
  }));
}

/** A refinement proposal coming from the LLM pass — all fields optional. */
export interface ProblemRefinement {
  key: ProblemKey;
  severity?: ProblemSeverity;
  confidence?: ProblemAssessment["confidence"];
  evidence?: string;
  dataSufficiency?: ProblemAssessment["dataSufficiency"];
}

/**
 * Merge LLM refinements over a deterministic baseline.
 * Rule: `measured` assessments are authoritative and never overridden;
 * `inferred`/`insufficient` ones accept a refinement (validated). A refinement
 * that resolves a problem becomes `inferred`; one that confirms it cannot be
 * judged stays `insufficient`.
 */
export function mergeProblemRefinements(
  problems: ProblemAssessment[],
  refinements: ProblemRefinement[]
): ProblemAssessment[] {
  const byKey = new Map(refinements.filter((r) => r && r.key).map((r) => [r.key, r]));
  return problems.map((p) => {
    if (p.dataSufficiency === "measured") return p;
    const r = byKey.get(p.key);
    if (!r) return p;
    const severity = r.severity && SEVERITIES.has(r.severity) ? r.severity : p.severity;
    const dataSufficiency = r.dataSufficiency === "insufficient" ? "insufficient" : "inferred";
    return {
      ...p,
      severity,
      evidence: r.evidence?.trim() ? r.evidence.trim() : p.evidence,
      confidence: r.confidence ?? p.confidence,
      dataSufficiency,
    };
  });
}

/**
 * The "solve it with strategy" set: any problem at the most severe band,
 * plus strategy-tier problems that reach the `deep` band.
 */
export function selectCriticalProblems(problems: ProblemAssessment[]): ProblemKey[] {
  return problems
    .filter((p) => p.severity === "critical" || (p.isStrategic && p.severity === "deep"))
    .map((p) => p.key);
}
