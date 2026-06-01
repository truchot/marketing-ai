// ============================================================
// Agent Mastra de conversation marketing généraliste.
// Modèle = adaptateur Claude Agent SDK. Utilisé par MastraResponseGenerator
// (derrière le port IResponseGenerator) pour les conversations non-discovery.
// ============================================================

import { Agent } from "@mastra/core/agent";
import { claudeAgentModel } from "@/mastra/model";
import { createConversationMemory } from "@/mastra/memory/conversation-memory";

export const CONVERSATION_AGENT_ID = "marketing-conversation";

const INSTRUCTIONS = `You are an expert marketing consultant assisting the user with their marketing projects.
Always reply in French (the product is French-facing), in a concrete, structured, and actionable way.
Adapt the depth of your answer to the question. Stay concise when possible.`;

export const conversationAgent = new Agent({
  id: CONVERSATION_AGENT_ID,
  name: CONVERSATION_AGENT_ID,
  instructions: INSTRUCTIONS,
  model: claudeAgentModel("claude-sonnet-4-5-20250929"),
  memory: createConversationMemory(),
});
