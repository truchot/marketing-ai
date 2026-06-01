// ============================================================
// Instance Mastra — point de composition unique des primitives Mastra.
// Importée par les routes / le composition-root.
// ============================================================

import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import {
  discoveryAgent,
  discoveryExtractionAgent,
  DISCOVERY_AGENT_ID,
  DISCOVERY_EXTRACTION_AGENT_ID,
} from "./agents/discovery-agent";
import { conversationAgent, CONVERSATION_AGENT_ID } from "./agents/conversation-agent";
import {
  strategyAgent,
  strategyExtractionAgent,
  STRATEGY_AGENT_ID,
  STRATEGY_EXTRACTION_AGENT_ID,
} from "./agents/strategy-agent";
import { onboardingWorkflow, ONBOARDING_WORKFLOW_ID } from "./workflows/onboarding";

const DB_URL = process.env.MASTRA_DB_URL ?? "file:./mastra.db";

export const mastra = new Mastra({
  agents: {
    [DISCOVERY_AGENT_ID]: discoveryAgent,
    [DISCOVERY_EXTRACTION_AGENT_ID]: discoveryExtractionAgent,
    [CONVERSATION_AGENT_ID]: conversationAgent,
    [STRATEGY_AGENT_ID]: strategyAgent,
    [STRATEGY_EXTRACTION_AGENT_ID]: strategyExtractionAgent,
  },
  workflows: {
    [ONBOARDING_WORKFLOW_ID]: onboardingWorkflow,
  },
  storage: new LibSQLStore({ id: "mastra-storage", url: DB_URL }),
  logger: new PinoLogger({ name: "marketing-ai", level: "info" }),
});

export function getDiscoveryAgent() {
  return mastra.getAgent(DISCOVERY_AGENT_ID);
}

export function getDiscoveryExtractionAgent() {
  return mastra.getAgent(DISCOVERY_EXTRACTION_AGENT_ID);
}

export function getConversationAgent() {
  return mastra.getAgent(CONVERSATION_AGENT_ID);
}

export function getStrategyAgent() {
  return mastra.getAgent(STRATEGY_AGENT_ID);
}

export function getStrategyExtractionAgent() {
  return mastra.getAgent(STRATEGY_EXTRACTION_AGENT_ID);
}
