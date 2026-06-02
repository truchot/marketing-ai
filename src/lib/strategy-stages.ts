// ============================================================
// Strategy build progress — shared contract.
//
// Single source of truth for the "build a strategy" funnel visualization,
// used both server-side (the /api/agent/strategy SSE route emits snapshots)
// and client-side (the StrategyWorkflowPanel renders them).
//
// The model mirrors Pierre Herubel's "4 Levels of B2B Marketing" funnel and
// maps each level onto this app's real strategy subsystems:
//   1. Business Strategy   → targetMarket, businessStrategy, OKRs
//   2. Marketing Strategy  → marketingFoundation, feedbackLoop, roadmapValidation
//   3. Marketing Tactics   → marketingPlan, marketingSystem
//   4. Marketing Operations→ operational tasks (strategy complete)
// with `diagnostic` as the entry point.
//
// This file is framework-neutral (types + pure functions only) so it can be
// imported from both the Node route and React components.
// ============================================================

export type StageStatus = "pending" | "active" | "done";

/**
 * Boolean snapshot of which strategy artifacts have been produced.
 * Computed server-side from the per-request StrategySessionState.
 */
export interface StrategyProgressSnapshot {
  diagnostic: boolean;
  targetMarket: boolean;
  businessStrategy: boolean;
  marketingFoundation: boolean;
  feedbackLoop: boolean;
  okrs: boolean;
  roadmapValidation: boolean;
  marketingPlan: boolean;
  marketingSystem: boolean;
  complete: boolean;
}

export type SnapshotKey = keyof StrategyProgressSnapshot;

export const EMPTY_SNAPSHOT: StrategyProgressSnapshot = {
  diagnostic: false,
  targetMarket: false,
  businessStrategy: false,
  marketingFoundation: false,
  feedbackLoop: false,
  okrs: false,
  roadmapValidation: false,
  marketingPlan: false,
  marketingSystem: false,
  complete: false,
};

/**
 * Order in which the strategist agent produces each artifact. Used to pick the
 * single "active" stage (the next not-yet-done step) — purely cosmetic.
 */
export const BUILD_ORDER: SnapshotKey[] = [
  "diagnostic",
  "targetMarket",
  "businessStrategy",
  "marketingFoundation",
  "feedbackLoop",
  "okrs",
  "roadmapValidation",
  "marketingPlan",
  "marketingSystem",
  "complete",
];

export interface StrategyChip {
  key: SnapshotKey;
  label: string;
}

export type StrategyLevelId = "business" | "marketing" | "tactics" | "operations";

export interface StrategyLevel {
  index: number;
  id: StrategyLevelId;
  title: string;
  description: string;
  chips: StrategyChip[];
}

/** Entry-point stage shown above the funnel. */
export const DIAGNOSTIC_CHIP: StrategyChip = {
  key: "diagnostic",
  label: "Diagnostic & maturity",
};

/** The 4 funnel levels (Herubel model) mapped onto the app's subsystems. */
export const STRATEGY_LEVELS: StrategyLevel[] = [
  {
    index: 1,
    id: "business",
    title: "Business Strategy",
    description: "Long-term decisions that set the company's direction.",
    chips: [
      { key: "businessStrategy", label: "Value proposition" },
      { key: "targetMarket", label: "Target market" },
      { key: "okrs", label: "Revenue objectives" },
    ],
  },
  {
    index: 2,
    id: "marketing",
    title: "Marketing Strategy",
    description: "The high-level plan to reach and convert the target market.",
    chips: [
      { key: "marketingFoundation", label: "Positioning & messaging" },
      { key: "feedbackLoop", label: "Customer research" },
      { key: "roadmapValidation", label: "Roadmap" },
    ],
  },
  {
    index: 3,
    id: "tactics",
    title: "Marketing Tactics",
    description: "The activities run to reach the market defined above.",
    chips: [
      { key: "marketingPlan", label: "Campaigns & channels" },
      { key: "marketingSystem", label: "System & automations" },
    ],
  },
  {
    index: 4,
    id: "operations",
    title: "Marketing Operations",
    description: "Day-to-day execution of the tactics.",
    chips: [{ key: "complete", label: "Tasks & execution" }],
  },
];

/** Total number of tracked stages (diagnostic + every level chip). */
export const TOTAL_STAGES =
  1 + STRATEGY_LEVELS.reduce((n, l) => n + l.chips.length, 0);

/** Number of completed stages in a snapshot. */
export function completedCount(snapshot: StrategyProgressSnapshot): number {
  return BUILD_ORDER.filter((k) => snapshot[k]).length;
}

/** The next not-yet-done stage, or null when idle or complete. */
export function activeKey(
  snapshot: StrategyProgressSnapshot,
  sessionActive: boolean
): SnapshotKey | null {
  if (!sessionActive || snapshot.complete) return null;
  return BUILD_ORDER.find((k) => !snapshot[k]) ?? null;
}

/** Status of a single stage. */
export function stageStatus(
  snapshot: StrategyProgressSnapshot,
  key: SnapshotKey,
  active: SnapshotKey | null
): StageStatus {
  if (snapshot[key]) return "done";
  if (active && key === active) return "active";
  return "pending";
}

/** Aggregate status of a funnel level from its chips. */
export function levelStatus(
  level: StrategyLevel,
  snapshot: StrategyProgressSnapshot,
  active: SnapshotKey | null
): StageStatus {
  if (level.chips.every((c) => snapshot[c.key])) return "done";
  const started =
    level.chips.some((c) => snapshot[c.key]) ||
    level.chips.some((c) => c.key === active);
  return started ? "active" : "pending";
}

/**
 * Monotonic OR-merge of two snapshots. Strategy building only moves forward, so
 * the client keeps a cumulative view even though server session state is reset
 * per request.
 */
export function mergeSnapshots(
  a: StrategyProgressSnapshot,
  b: StrategyProgressSnapshot
): StrategyProgressSnapshot {
  const out = { ...a };
  for (const k of Object.keys(out) as SnapshotKey[]) {
    out[k] = a[k] || b[k];
  }
  return out;
}
