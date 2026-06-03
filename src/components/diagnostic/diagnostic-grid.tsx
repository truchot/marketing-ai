import { AlertTriangle, HelpCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  MarketingDiagnostic,
  ProblemAssessment,
  ProblemKey,
  ProblemSeverity,
} from "@/types/marketing-strategy";

// ── Severity bands (mirrors the 5 difficulty levels of the framework) ──

interface SeverityMeta {
  rank: number; // 1 = easiest … 5 = hardest
  legend: string;
  cell: string; // cell background + border tint
  chip: string; // severity chip colours
}

const SEVERITY_META: Record<ProblemSeverity, SeverityMeta> = {
  easily_fixed: {
    rank: 1,
    legend: "Easily fixed",
    cell: "border-emerald-500/40 bg-emerald-500/[0.08]",
    chip: "bg-emerald-500/15 text-emerald-300",
  },
  normal: {
    rank: 2,
    legend: "Needs iteration",
    cell: "border-amber-500/40 bg-amber-500/[0.08]",
    chip: "bg-amber-500/15 text-amber-300",
  },
  problematic: {
    rank: 3,
    legend: "Requires a plan",
    cell: "border-orange-500/45 bg-orange-500/[0.10]",
    chip: "bg-orange-500/15 text-orange-300",
  },
  deep: {
    rank: 4,
    legend: "Review culture",
    cell: "border-rose-500/50 bg-rose-500/[0.12]",
    chip: "bg-rose-500/15 text-rose-300",
  },
  critical: {
    rank: 5,
    legend: "Solve with strategy",
    cell: "border-red-500/60 bg-red-500/[0.16]",
    chip: "bg-red-500/20 text-red-300",
  },
};

const SEVERITY_ORDER: ProblemSeverity[] = [
  "easily_fixed",
  "normal",
  "problematic",
  "deep",
  "critical",
];

// Neutral styling for problems the discovery data cannot judge — honesty made visible.
const INSUFFICIENT_CELL = "border-zinc-700 border-dashed bg-zinc-800/40";

function isInsufficient(p: ProblemAssessment): boolean {
  return p.dataSufficiency === "insufficient";
}

/** Sort: most actionable first (hardest band → easiest), unknown last, strategic first within a tie. */
function sortProblems(problems: ProblemAssessment[]): ProblemAssessment[] {
  return [...problems].sort((a, b) => {
    const aUnknown = isInsufficient(a);
    const bUnknown = isInsufficient(b);
    if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
    const rankDiff = SEVERITY_META[b.severity].rank - SEVERITY_META[a.severity].rank;
    if (rankDiff !== 0) return rankDiff;
    if (a.isStrategic !== b.isStrategic) return a.isStrategic ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}

// ── Cell ──────────────────────────────────────────────────

function ProblemCell({
  problem,
  isCritical,
}: {
  problem: ProblemAssessment;
  isCritical: boolean;
}) {
  const unknown = isInsufficient(problem);
  const meta = SEVERITY_META[problem.severity];

  return (
    <div
      title={problem.evidence}
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3.5 transition-colors",
        unknown ? INSUFFICIENT_CELL : meta.cell,
        problem.isStrategic && !unknown && "border-dashed border-2",
        isCritical && "ring-1 ring-red-500/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-zinc-100">
          {problem.label}
        </p>
        {problem.isStrategic && (
          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300">
            <Sparkles className="size-2.5" />
            Strategy
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {unknown ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-700/50 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
            <HelpCircle className="size-3" />
            Insufficient data
          </span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              meta.chip,
            )}
          >
            {problem.severity === "critical" && <AlertTriangle className="size-3" />}
            {meta.legend}
          </span>
        )}
        <span
          className="ml-auto text-[10px] uppercase tracking-wide text-zinc-500"
          title={`Confidence: ${problem.confidence}`}
        >
          {problem.confidence}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-zinc-500 line-clamp-2">
        {problem.recommendation}
      </p>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-zinc-400">
      {SEVERITY_ORDER.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span
            className={cn("size-2.5 rounded-sm border", SEVERITY_META[s].cell)}
          />
          {SEVERITY_META[s].legend}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className={cn("size-2.5 rounded-sm border", INSUFFICIENT_CELL)} />
        Insufficient data
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm border-2 border-dashed border-red-500/60" />
        Strategy-tier problem
      </span>
    </div>
  );
}

// ── Grid ──────────────────────────────────────────────────

export interface DiagnosticGridProps {
  problems: ProblemAssessment[];
  criticalProblems?: ProblemKey[];
  maturityScore?: number;
  className?: string;
}

export default function DiagnosticGrid({
  problems,
  criticalProblems,
  maturityScore,
  className,
}: DiagnosticGridProps) {
  const criticalSet = new Set<ProblemKey>(
    criticalProblems ??
      problems
        .filter((p) => p.severity === "critical" || (p.isStrategic && p.severity === "deep"))
        .map((p) => p.key),
  );
  const sorted = sortProblems(problems);

  return (
    <section
      className={cn(
        "rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6",
        className,
      )}
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            16 Common Marketing Problems
          </h2>
          <p className="text-sm text-zinc-500">
            Sorted by how difficult they are to solve
          </p>
        </div>
        <div className="flex items-center gap-2">
          {criticalSet.size > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300">
              <AlertTriangle className="size-3.5" />
              {criticalSet.size} critical
            </span>
          )}
          {typeof maturityScore === "number" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
              <span className="text-zinc-500">Maturity</span>
              <span className="font-semibold text-zinc-100">{maturityScore}/100</span>
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {sorted.map((problem) => (
          <ProblemCell
            key={problem.key}
            problem={problem}
            isCritical={criticalSet.has(problem.key)}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-zinc-800 pt-4">
        <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-zinc-600">
          Difficulty to solve →
        </span>
      </div>
      <div className="mt-3">
        <Legend />
      </div>
    </section>
  );
}

// Convenience overload for passing a whole diagnostic.
export function DiagnosticGridFromDiagnostic({
  diagnostic,
  className,
}: {
  diagnostic: Pick<MarketingDiagnostic, "problems" | "criticalProblems" | "maturityScore">;
  className?: string;
}) {
  return (
    <DiagnosticGrid
      problems={diagnostic.problems}
      criticalProblems={diagnostic.criticalProblems}
      maturityScore={diagnostic.maturityScore}
      className={className}
    />
  );
}
