// ============================================================
// Agent Mastra d'extraction structurée pour l'Experimentation.
// Modèle = adaptateur Claude Agent SDK. Prompt réutilisé depuis
// src/agents/growth-strategist.ts (.claude/agents/growth-strategist.md).
// ============================================================

import { Agent } from "@mastra/core/agent";
import { getGrowthStrategistSystemPrompt } from "@/agents/growth-strategist";
import { claudeAgentModel } from "@/mastra/model";

export const EXPERIMENTATION_EXTRACTION_AGENT_ID = "lia-experimentation-extraction";

// Agent SANS tools pour l'extraction structurée (équivalent maxTurns:1).
export const experimentationExtractionAgent = new Agent({
  id: EXPERIMENTATION_EXTRACTION_AGENT_ID,
  name: EXPERIMENTATION_EXTRACTION_AGENT_ID,
  instructions: () => getGrowthStrategistSystemPrompt(),
  model: claudeAgentModel("claude-sonnet-4-5-20250929"),
});
