// ============================================================
// Helper de génération de texte one-shot via l'adaptateur Claude Agent SDK.
//
// Permet aux utilitaires "feuilles" (ex: callClaudeHaiku) de générer du
// texte SANS appeler query() directement : tout passe par claudeAgentModel,
// le SEUL endroit qui appelle query(). Voir [[mastra-migration]].
// ============================================================

import { claudeAgentModel, type ClaudeAgentModelDefaults } from "./claude-agent-sdk-model";

/**
 * Génère du texte pour un prompt simple via le modèle Claude Agent SDK.
 * @returns le texte concaténé des blocs de la réponse.
 */
export async function generateText(
  modelId: string,
  prompt: string,
  defaults?: ClaudeAgentModelDefaults
): Promise<string> {
  const model = claudeAgentModel(modelId, defaults);
  const res = await model.doGenerate({
    prompt: [{ role: "user", content: [{ type: "text", text: prompt }] }],
  });
  return res.content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text)
    .join("");
}
