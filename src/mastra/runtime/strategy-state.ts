// ============================================================
// Strategy session state, carried per-request via RequestContext.
//
// The strategy tools are stateful within a session: each step produces an
// artifact the later steps read (diagnostic → target market → business
// strategy → foundation → feedback loop → OKRs → roadmap validation →
// marketing plan → marketing system → tasks → save). We carry this state via
// RequestContext (created per request in the route) instead of a racy
// module-global. See [[mastra-migration]].
// ============================================================

import type { BusinessDiscovery } from "@/types/business-discovery";
import type {
  MarketingDiagnostic,
  OKR,
  TargetMarket,
  BusinessStrategy,
  MarketingFoundation,
  FeedbackLoop,
  RoadmapValidation,
  MarketingPlan,
  MarketingSystem,
} from "@/types/marketing-strategy";
import type { StrategyProgressSnapshot } from "@/lib/strategy-stages";

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export interface StrategySessionState {
  discovery: BusinessDiscovery | null;
  diagnostic: MarketingDiagnostic | null;
  // Strategic layer (4 subsystems)
  targetMarket: TargetMarket | null;
  businessStrategy: BusinessStrategy | null;
  marketingFoundation: MarketingFoundation | null;
  feedbackLoop: FeedbackLoop | null;
  validatedOKRs: OKR[];
  roadmapValidation: RoadmapValidation | null;
  // Tactical layer (2 subsystems)
  marketingPlan: MarketingPlan | null;
  marketingSystem: MarketingSystem | null;
  // Flow control
  strategyComplete: boolean;
  pendingChoices: { question: string; choices: ChoiceOption[] } | null;
}

export const STRATEGY_STATE_KEY = "strategyState";

export function createStrategySessionState(): StrategySessionState {
  return {
    discovery: null,
    diagnostic: null,
    targetMarket: null,
    businessStrategy: null,
    marketingFoundation: null,
    feedbackLoop: null,
    validatedOKRs: [],
    roadmapValidation: null,
    marketingPlan: null,
    marketingSystem: null,
    strategyComplete: false,
    pendingChoices: null,
  };
}

/**
 * Derive a boolean progress snapshot from the session state. Mirrors the
 * StrategyProgressSnapshot contract consumed by the funnel UI. Each artifact is
 * "done" once its subsystem has been produced by the corresponding tool.
 */
export function snapshotFromState(
  s: StrategySessionState
): StrategyProgressSnapshot {
  return {
    diagnostic: s.diagnostic !== null,
    targetMarket: s.targetMarket !== null,
    businessStrategy: s.businessStrategy !== null,
    marketingFoundation: s.marketingFoundation !== null,
    feedbackLoop: s.feedbackLoop !== null,
    okrs: s.validatedOKRs.length > 0,
    roadmapValidation: s.roadmapValidation !== null,
    marketingPlan: s.marketingPlan !== null,
    marketingSystem: s.marketingSystem !== null,
    complete: s.strategyComplete,
  };
}
