"use client";

// ============================================================
// PriorityPyramid — visualizes a strategy against the 2026 Marketing
// Priorities pyramid (foundation → leverage → surface).
//
// Presentational only: it consumes a PyramidAssessment computed by
// `assessPriorityPyramid` (domain). Each item chip is colored by status:
//   covered = emerald, missing = rose, untracked = dim zinc.
// ============================================================

import type {
  PyramidAssessment,
  PyramidVerdict,
  ItemStatus,
  TierAssessment,
} from "@/domains/strategy/services/priority-pyramid";

const STATUS_STYLES: Record<ItemStatus, string> = {
  covered: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  missing: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  untracked: "border-zinc-800 bg-zinc-900 text-zinc-600",
};

const STATUS_LABEL: Record<ItemStatus, string> = {
  covered: "covered",
  missing: "missing",
  untracked: "not tracked",
};

const VERDICT_STYLES: Record<PyramidVerdict, string> = {
  "foundation-first": "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  building: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  fragile: "border-rose-500/40 bg-rose-500/10 text-rose-300",
};

const VERDICT_LABEL: Record<PyramidVerdict, string> = {
  "foundation-first": "Foundation-first",
  building: "Building foundations",
  fragile: "Fragile base",
};

// Visual width per tier to evoke a pyramid (apex narrow → base wide).
const TIER_WIDTH: Record<TierAssessment["tier"], string> = {
  surface: "w-full max-w-md",
  leverage: "w-full max-w-2xl",
  foundation: "w-full max-w-4xl",
};

export interface PriorityPyramidProps {
  assessment: PyramidAssessment;
  companyName?: string;
}

export function PriorityPyramid({ assessment, companyName }: PriorityPyramidProps) {
  // Display apex-first (surface → foundation) so it reads as a pyramid.
  const tiersTopDown = [...assessment.tiers].reverse();

  return (
    <section className="mx-auto max-w-4xl px-4 py-8" aria-label="2026 Marketing Priorities pyramid">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-100">2026 Marketing Priorities</h1>
        {companyName && <p className="mt-1 text-sm text-zinc-500">{companyName}</p>}

        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold text-violet-400">
              {assessment.foundationFirstScore}
            </span>
            <span className="text-sm text-zinc-500">/ 100 foundation-first</span>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${VERDICT_STYLES[assessment.verdict]}`}
          >
            {VERDICT_LABEL[assessment.verdict]}
          </span>
        </div>

        {assessment.noiseRisk && (
          <p className="mt-3 text-xs text-rose-400" role="status">
            ⚠ Weak foundation — shore up the base before investing in trends or surface tactics.
          </p>
        )}
      </header>

      <div className="flex flex-col items-center gap-3">
        {tiersTopDown.map((tier) => (
          <div key={tier.tier} className={TIER_WIDTH[tier.tier]}>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-zinc-200">{tier.framing}</span>
                {tier.trackedCount > 0 ? (
                  <span className="text-xs text-zinc-500">
                    {tier.coveredCount}/{tier.trackedCount} covered
                  </span>
                ) : (
                  <span className="text-xs text-zinc-600">noise — not optimized for</span>
                )}
              </div>
              <ul className="flex flex-wrap justify-center gap-2">
                {tier.items.map((item) => (
                  <li key={item.id}>
                    <span
                      className={`inline-block rounded-lg border px-3 py-1.5 text-xs font-medium ${STATUS_STYLES[item.status]}`}
                      title={STATUS_LABEL[item.status]}
                      aria-label={`${item.label}: ${STATUS_LABEL[item.status]}`}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500">
        <LegendDot className="bg-emerald-500/60" label="covered" />
        <LegendDot className="bg-rose-500/60" label="missing" />
        <LegendDot className="bg-zinc-700" label="not tracked" />
      </footer>
    </section>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} aria-hidden />
      {label}
    </span>
  );
}

export default PriorityPyramid;
