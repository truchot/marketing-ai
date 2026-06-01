// ============================================================
// Agent Mastra "lia-discovery"
// Modèle = adaptateur Claude Agent SDK (claudeAgentMastraModel).
// Prompt système réutilisé depuis src/agents/discovery.ts.
// ============================================================

import { Agent } from "@mastra/core/agent";
import { getDiscoverySystemPrompt } from "@/agents/discovery";
import { claudeAgentModel } from "@/mastra/model";
import { discoveryTools } from "@/mastra/tools/discovery-tools";
import { createConversationMemory } from "@/mastra/memory/conversation-memory";

export const DISCOVERY_AGENT_ID = "lia-discovery";

export const discoveryAgent = new Agent({
  id: DISCOVERY_AGENT_ID,
  name: DISCOVERY_AGENT_ID,
  // Fonction = lecture paresseuse du prompt (.claude/agents/business-discovery.md),
  // différée hors de l'évaluation du module.
  instructions: () => getDiscoverySystemPrompt(),
  model: claudeAgentModel("claude-sonnet-4-5-20250929"),
  tools: discoveryTools,
  memory: createConversationMemory(),
});

export const DISCOVERY_EXTRACTION_AGENT_ID = "lia-discovery-extraction";

// Agent SANS tools, dédié à l'extraction structurée (équivalent de l'ancien
// maxTurns:1 — aucun risque d'appel d'outil pendant l'extraction).
export const discoveryExtractionAgent = new Agent({
  id: DISCOVERY_EXTRACTION_AGENT_ID,
  name: DISCOVERY_EXTRACTION_AGENT_ID,
  instructions: () => getDiscoverySystemPrompt(),
  model: claudeAgentModel("claude-sonnet-4-5-20250929"),
});
