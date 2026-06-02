"use client";

import {
  STRATEGY_LEVELS,
  DIAGNOSTIC_CHIP,
  TOTAL_STAGES,
  activeKey,
  completedCount,
  levelStatus,
  stageStatus,
  type StageStatus,
  type StrategyChip,
  type StrategyLevel,
  type StrategyLevelId,
  type StrategyProgressSnapshot,
} from "@/lib/strategy-stages";

interface StrategyWorkflowPanelProps {
  snapshot: StrategyProgressSnapshot;
  /** True while a strategy turn is streaming — drives the "active" pulse. */
  active?: boolean;
}

// Per-level visual identity. Mirrors Herubel's pink → amber → green → blue
// funnel, tuned for the dark (zinc-950) theme. `band` is the trapezoid fill,
// scaled up via opacity as the level activates/completes.
const LEVEL_STYLES: Record<
  StrategyLevelId,
  { band: string; ring: string; bar: string; dot: string }
> = {
  business: {
    band: "from-rose-500 to-rose-400",
    ring: "ring-rose-400/60",
    bar: "bg-rose-400",
    dot: "bg-rose-400",
  },
  marketing: {
    band: "from-amber-500 to-amber-400",
    ring: "ring-amber-400/60",
    bar: "bg-amber-400",
    dot: "bg-amber-400",
  },
  tactics: {
    band: "from-emerald-500 to-emerald-400",
    ring: "ring-emerald-400/60",
    bar: "bg-emerald-400",
    dot: "bg-emerald-400",
  },
  operations: {
    band: "from-sky-500 to-sky-400",
    ring: "ring-sky-400/60",
    bar: "bg-sky-400",
    dot: "bg-sky-400",
  },
};

// Trapezoid edge widths per level (fraction of panel width). Consecutive
// top/bottom values connect so the four bands read as one continuous funnel.
const FUNNEL_EDGES = [
  { top: 1.0, bottom: 0.88 },
  { top: 0.88, bottom: 0.76 },
  { top: 0.76, bottom: 0.64 },
  { top: 0.64, bottom: 0.52 },
];

function clip(top: number, bottom: number): string {
  const lt = ((1 - top) / 2) * 100;
  const rt = ((1 + top) / 2) * 100;
  const lb = ((1 - bottom) / 2) * 100;
  const rb = ((1 + bottom) / 2) * 100;
  return `polygon(${lt}% 0, ${rt}% 0, ${rb}% 100%, ${lb}% 100%)`;
}

function bandOpacity(status: StageStatus): string {
  if (status === "done") return "opacity-90";
  if (status === "active") return "opacity-60";
  return "opacity-[0.18]";
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chip({ status, label }: { status: StageStatus; label: string }) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-all duration-500";
  if (status === "done") {
    return (
      <span className={`${base} bg-zinc-100 text-zinc-900 shadow-sm`}>
        <CheckIcon className="h-3 w-3 text-emerald-600" />
        {label}
      </span>
    );
  }
  if (status === "active") {
    return (
      <span
        className={`${base} bg-zinc-800 text-zinc-100 ring-2 ring-white/50`}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        {label}
      </span>
    );
  }
  return (
    <span className={`${base} border border-zinc-700/70 bg-zinc-900/60 text-zinc-500`}>
      {label}
    </span>
  );
}

function LevelTitlePill({
  index,
  title,
  status,
}: {
  index: number;
  title: string;
  status: StageStatus;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 self-center rounded-full border px-3 py-1 text-sm font-bold transition-colors duration-500 ${
        status === "pending"
          ? "border-zinc-700/60 bg-zinc-950/70 text-zinc-400"
          : "border-zinc-700 bg-zinc-950/85 text-zinc-50"
      }`}
    >
      <span className="opacity-70">{index}/</span>
      {title}
      {status === "done" && (
        <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
      )}
      {status === "active" && (
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
      )}
    </div>
  );
}

function FunnelLevel({
  level,
  edges,
  snapshot,
  active,
}: {
  level: StrategyLevel;
  edges: { top: number; bottom: number };
  snapshot: StrategyProgressSnapshot;
  active: ReturnType<typeof activeKey>;
}) {
  const status = levelStatus(level, snapshot, active);
  const style = LEVEL_STYLES[level.id];

  return (
    <div className="relative px-3 pb-2 pt-3">
      {/* Trapezoid colored band (clipped background) */}
      <div
        className={`absolute inset-x-0 top-0 bottom-0 bg-gradient-to-b ${style.band} ${bandOpacity(
          status
        )} transition-opacity duration-700`}
        style={{ clipPath: clip(edges.top, edges.bottom) }}
        aria-hidden
      />
      {status === "active" && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 bottom-0 ring-2 ${style.ring}`}
          style={{ clipPath: clip(edges.top, edges.bottom) }}
          aria-hidden
        />
      )}

      {/* Content overlay (never clipped) */}
      <div className="relative flex flex-col items-center gap-2 px-6 text-center">
        <LevelTitlePill index={level.index} title={level.title} status={status} />
        <p className="max-w-[15rem] text-[11px] leading-snug text-zinc-300">
          {level.description}
        </p>
        <div className="flex flex-wrap justify-center gap-1.5 pb-1">
          {level.chips.map((chip: StrategyChip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              status={stageStatus(snapshot, chip.key, active)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Dashed feedback loop arrow (left edge), lit when the feedback loop is set. */
function FeedbackLoop({ lit }: { lit: boolean }) {
  const stroke = lit ? "#34d399" : "#52525b";
  return (
    <div className="pointer-events-none absolute left-0 top-[18%] bottom-[14%] w-10">
      <svg viewBox="0 0 40 200" className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <marker
            id="fb-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="3"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill={stroke} />
          </marker>
        </defs>
        <path
          d="M30 188 C 6 150, 6 60, 28 14"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeDasharray="5 5"
          markerEnd="url(#fb-arrow)"
        />
      </svg>
      <span
        className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[10px] font-semibold tracking-wide"
        style={{ color: stroke }}
      >
        Feedback
      </span>
    </div>
  );
}

export default function StrategyWorkflowPanel({
  snapshot,
  active = false,
}: StrategyWorkflowPanelProps) {
  const activeStage = activeKey(snapshot, active);
  const done = completedCount(snapshot);
  const pct = Math.round((done / TOTAL_STAGES) * 100);
  const diagnosticStatus = stageStatus(snapshot, "diagnostic", activeStage);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 px-5 py-4 backdrop-blur">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold tracking-tight text-zinc-100">
            Building your strategy
          </h2>
          <span className="text-xs font-medium text-zinc-500">
            {done}/{TOTAL_STAGES}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          4 levels of B2B marketing
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-400 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Diagnostic entry stage */}
      <div className="px-5 pt-5">
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors duration-500 ${
            diagnosticStatus === "pending"
              ? "border-zinc-800 bg-zinc-900/40"
              : diagnosticStatus === "active"
              ? "border-zinc-600 bg-zinc-900 ring-1 ring-white/20"
              : "border-emerald-500/30 bg-emerald-500/5"
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
              diagnosticStatus === "done"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {diagnosticStatus === "done" ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <span aria-hidden>◇</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-200">
              {DIAGNOSTIC_CHIP.label}
            </p>
            <p className="text-[10px] text-zinc-500">
              SWOT &amp; maturity — where the work starts
            </p>
          </div>
          {diagnosticStatus === "active" && (
            <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-white" />
          )}
        </div>
        <div className="mx-auto mt-1 h-3 w-px bg-zinc-700" />
      </div>

      {/* Funnel */}
      <div className="relative px-2 pb-4">
        <FeedbackLoop lit={snapshot.feedbackLoop} />
        {STRATEGY_LEVELS.map((level, i) => (
          <FunnelLevel
            key={level.id}
            level={level}
            edges={FUNNEL_EDGES[i]}
            snapshot={snapshot}
            active={activeStage}
          />
        ))}
        {/* Funnel tip + outcome */}
        <div className="mt-1 flex flex-col items-center">
          <div className="h-3 w-px bg-zinc-700" />
          <div
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors duration-500 ${
              snapshot.complete
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40"
                : "bg-zinc-900 text-zinc-500 ring-1 ring-zinc-700"
            }`}
          >
            {snapshot.complete ? "Strategy saved ✓" : "Revenue"}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-auto border-t border-zinc-800 px-5 py-3">
        <div className="flex items-center justify-center gap-4 text-[10px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-700" /> Pending
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/80" /> In
            progress
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckIcon className="h-3 w-3 text-emerald-400" /> Done
          </span>
        </div>
      </div>
    </div>
  );
}
