import { describe, it, expect } from "vitest";
import { Agent } from "@mastra/core/agent";
import { claudeAgentModel } from "../claude-agent-sdk-model";

// Tier 2 — nécessite un vrai CLAUDE_CODE_OAUTH_TOKEN et spawn un sous-process.
// No-op en CI sans token. Sert aussi de vérification de compatibilité de type
// (le modèle custom est passé comme `model` d'un Agent Mastra).
const hasToken = !!process.env.CLAUDE_CODE_OAUTH_TOKEN;

describe.skipIf(!hasToken)("ClaudeAgentModel — intégration Mastra (token requis)", () => {
  it("génère du texte via agent.generate", async () => {
    const agent = new Agent({
      id: "spike-text",
      name: "spike-text",
      instructions: "Tu réponds en un seul mot.",
      model: claudeAgentModel("claude-haiku-4-5-20251001"),
    });
    const res = await agent.generate("Dis le mot OK et rien d'autre.");
    expect(res.text.trim().length).toBeGreaterThan(0);
  }, 90_000);

  it("streame du texte via agent.stream", async () => {
    const agent = new Agent({
      id: "spike-stream",
      name: "spike-stream",
      instructions: "Tu réponds brièvement.",
      model: claudeAgentModel("claude-haiku-4-5-20251001"),
    });
    const stream = await agent.stream("Compte de 1 à 3.");
    let acc = "";
    for await (const chunk of stream.textStream) acc += chunk;
    expect(acc.length).toBeGreaterThan(0);
  }, 90_000);
});
