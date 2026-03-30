// ============================================================
// Strategy Tools Definitions for Claude Agent SDK
// Using MCP (Model Context Protocol) server approach
// ============================================================

import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type {
  MarketingDiagnostic,
  TargetMarket,
  BusinessStrategy,
  MarketingFoundation,
  FeedbackLoop,
  RoadmapValidation,
  MarketingPlan,
  MarketingSystem,
  OKR,
} from "@/types/marketing-strategy";
import { createStrategicTools } from "./tool-handlers/strategic-tools";
import { createOKRTools } from "./tool-handlers/okr-tools";
import { createTacticalTools } from "./tool-handlers/tactical-tools";
import { createUtilityTools } from "./tool-handlers/utility-tools";

// ============================================================
// Per-request state for strategy session flow control
// ============================================================

interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export interface StrategyRequestState {
  discovery: BusinessDiscovery | null;
  diagnostic: MarketingDiagnostic | null;
  targetMarket: TargetMarket | null;
  businessStrategy: BusinessStrategy | null;
  marketingFoundation: MarketingFoundation | null;
  feedbackLoop: FeedbackLoop | null;
  validatedOKRs: OKR[];
  roadmapValidation: RoadmapValidation | null;
  validatedMarketingPlan: MarketingPlan | null;
  validatedMarketingSystem: MarketingSystem | null;
  strategyComplete: boolean;
  pendingChoices: { question: string; choices: ChoiceOption[] } | null;
}

export function createStrategyRequestState(): StrategyRequestState {
  return {
    discovery: null,
    diagnostic: null,
    targetMarket: null,
    businessStrategy: null,
    marketingFoundation: null,
    feedbackLoop: null,
    validatedOKRs: [],
    roadmapValidation: null,
    validatedMarketingPlan: null,
    validatedMarketingSystem: null,
    strategyComplete: false,
    pendingChoices: null,
  };
}

// ============================================================
// Factory: creates a fresh MCP server per request
// ============================================================

export function createStrategyMcpServer(state: StrategyRequestState) {
  return createSdkMcpServer({
    name: "strategy-tools",
    tools: [
      ...createStrategicTools(state),
      ...createOKRTools(state),
      ...createTacticalTools(state),
      ...createUtilityTools(state),
    ],
  });
}
