// ============================================================
// Agent Mastra "lia-strategy" + agent d'extraction structurée.
// Modèle = adaptateur Claude Agent SDK. Prompt réutilisé depuis
// src/agents/strategist.ts (.claude/agents/strategist.md).
// ============================================================

import { Agent } from "@mastra/core/agent";
import { getStrategistSystemPrompt } from "@/agents/strategist";
import { claudeAgentModel } from "@/mastra/model";
import { strategyTools } from "@/mastra/tools/strategy-tools";

export const STRATEGY_AGENT_ID = "lia-strategy";
export const STRATEGY_EXTRACTION_AGENT_ID = "lia-strategy-extraction";

export const strategyAgent = new Agent({
  id: STRATEGY_AGENT_ID,
  name: STRATEGY_AGENT_ID,
  instructions: () => getStrategistSystemPrompt(),
  model: claudeAgentModel("claude-sonnet-4-5-20250929"),
  tools: strategyTools,
});

// Agent SANS tools pour l'extraction structurée (équivalent maxTurns:1).
export const strategyExtractionAgent = new Agent({
  id: STRATEGY_EXTRACTION_AGENT_ID,
  name: STRATEGY_EXTRACTION_AGENT_ID,
  instructions: () => getStrategistSystemPrompt(),
  model: claudeAgentModel("claude-sonnet-4-5-20250929"),
});
