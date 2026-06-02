"use client";

// ============================================================
// PriorityPyramid — visualizes a strategy against the 2026 Marketing
// Priorities pyramid (foundation → leverage → surface).
//
// Consumes a PyramidAssessment computed by `assessPriorityPyramid`
// (domain). Each item chip is colored by status (covered = emerald,
// missing = rose, untracked = dim) and is tappable: selecting it opens a
// shadcn bottom Sheet showing the data stored for that item (item.detail).
// ============================================================

import { useState } from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  TIER_FRAMING,
  type PyramidAssessment,
  type PyramidVerdict,
  type ItemStatus,
  type TierAssessment,
  type PyramidItemAssessment,
} from "@/domains/strategy/services/priority-pyramid";

const STATUS_STYLES: Record<ItemStatus, string> = {
  covered: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
  missing: "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
  untracked: "border-zinc-800 bg-zinc-900 text-zinc-600 hover:bg-zinc-800",
};

const STATUS_BADGE: Record<ItemStatus, string> = {
  covered: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  missing: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  untracked: "border-zinc-700 bg-zinc-800 text-zinc-400",
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
  /** Item id to open in the detail sheet on load (deep-linkable). */
  initialItemId?: string;
  /** Open the drawer at the full-screen snap point on load (deep-linkable). */
  initialExpanded?: boolean;
}

// Drawer opens at 62vh (floating, with side gaps); dragging up snaps to a
// full-screen, edge-to-edge view.
const SNAP_POINTS: (number | string)[] = [0.62, 1];

export function PriorityPyramid({
  assessment,
  companyName,
  initialItemId,
  initialExpanded,
}: PriorityPyramidProps) {
  const initial =
    (initialItemId &&
      assessment.tiers.flatMap((t) => t.items).find((i) => i.id === initialItemId)) ||
    null;
  const [selected, setSelected] = useState<PyramidItemAssessment | null>(initial);
  const [snap, setSnap] = useState<number | string | null>(
    initialExpanded ? SNAP_POINTS[1] : SNAP_POINTS[0]
  );
  const expanded = snap === 1;

  // Display apex-first (surface → foundation) so it reads as a pyramid.
  const tiersTopDown = [...assessment.tiers].reverse();

  function openItem(item: PyramidItemAssessment) {
    setSnap(SNAP_POINTS[0]); // always reopen at the 62% snap
    setSelected(item);
  }

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

        <p className="mt-3 text-xs text-zinc-600">Tap an item to see what&apos;s stored for it.</p>
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
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={`inline-block cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${STATUS_STYLES[item.status]}`}
                      aria-label={`${item.label}: ${STATUS_LABEL[item.status]} — tap for details`}
                    >
                      {item.label}
                    </button>
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

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        snapPoints={SNAP_POINTS}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
        fadeFromIndex={0}
      >
        <DrawerContent
          className={cn(
            "mx-auto h-dvh bg-zinc-900 text-zinc-100 transition-[width,border-radius] duration-200",
            expanded
              ? "w-full max-w-none border-x-0 border-zinc-800"
              : "w-[calc(100%-1.5rem)] max-w-2xl rounded-2xl border border-zinc-700 shadow-2xl shadow-black/50"
          )}
        >
          {selected && (
            <>
              <div className="flex shrink-0 items-start justify-between gap-2 px-4 pt-3">
                <div>
                  <div className="flex items-center gap-2">
                    <DrawerTitle className="text-zinc-100">{selected.label}</DrawerTitle>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        STATUS_BADGE[selected.status]
                      )}
                    >
                      {STATUS_LABEL[selected.status]}
                    </span>
                  </div>
                  <DrawerDescription className="mt-0.5 text-zinc-500">
                    {TIER_FRAMING[selected.tier]}
                  </DrawerDescription>
                </div>
                <DrawerClose
                  aria-label="Close"
                  className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                >
                  <XIcon className="size-4" />
                </DrawerClose>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
                {selected.detail.note ? (
                  <p className="text-sm text-zinc-500">{selected.detail.note}</p>
                ) : (
                  <dl className="space-y-3">
                    {selected.detail.fields.map((f) => (
                      <div key={f.label}>
                        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          {f.label}
                        </dt>
                        <dd className="mt-1 text-sm text-zinc-200">
                          {f.values.length === 1 ? (
                            f.values[0]
                          ) : (
                            <ul className="list-disc space-y-0.5 pl-4 marker:text-zinc-600">
                              {f.values.map((v, i) => (
                                <li key={i}>{v}</li>
                              ))}
                            </ul>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
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
