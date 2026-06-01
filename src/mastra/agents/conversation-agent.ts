// ============================================================
// Agent Mastra de conversation marketing généraliste.
// Modèle = adaptateur Claude Agent SDK. Utilisé par MastraResponseGenerator
// (derrière le port IResponseGenerator) pour les conversations non-discovery.
// ============================================================

import { Agent } from "@mastra/core/agent";
import { claudeAgentModel } from "@/mastra/model";
import { createConversationMemory } from "@/mastra/memory/conversation-memory";

export const CONVERSATION_AGENT_ID = "marketing-conversation";

const INSTRUCTIONS = `Tu es un consultant marketing expert qui assiste l'utilisateur sur ses projets marketing.
Réponds en français, de manière concrète, structurée et actionnable.
Adapte la profondeur de ta réponse à la question. Reste concis quand c'est possible.`;

export const conversationAgent = new Agent({
  id: CONVERSATION_AGENT_ID,
  name: CONVERSATION_AGENT_ID,
  instructions: INSTRUCTIONS,
  model: claudeAgentModel("claude-sonnet-4-5-20250929"),
  memory: createConversationMemory(),
});
