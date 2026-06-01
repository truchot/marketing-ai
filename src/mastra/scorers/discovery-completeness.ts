// ============================================================
// Scorer "discovery-completeness" : mesure la couverture des 5 blocs
// BusinessDiscovery dans une sortie d'agent.
//
// La logique de score est une fonction PURE (scoreDiscoveryCompleteness),
// testable hors ligne sans token. Le scorer Mastra l'enveloppe via
// generateScore.
//
// NB : un scorer à juge LLM utiliserait `judge: { model: claudeAgentModel(...) }`
// pour respecter la règle OAuth (jamais de clé API Anthropic directe). Voir [[mastra-migration]].
// ============================================================

import { createScorer } from "@mastra/core/evals";

/** Les 5 dimensions de haut niveau de BusinessDiscovery. */
export const DISCOVERY_DIMENSIONS = [
  "problem",
  "valueProposition",
  "audiences",
  "currentMarketing",
  "businessContext",
] as const;

/** Mots-clés FR/EN qui signalent qu'une dimension est abordée. */
const DIMENSION_SIGNALS: Record<(typeof DISCOVERY_DIMENSIONS)[number], string[]> = {
  problem: ["problème", "problem", "pain", "douleur", "frustration"],
  valueProposition: ["valeur", "value", "proposition", "différenc", "transformation", "bénéfice"],
  audiences: ["audience", "cible", "segment", "client", "persona", "marché cible"],
  currentMarketing: ["marketing", "canal", "canaux", "campagne", "acquisition", "réseaux sociaux", "seo"],
  businessContext: ["objectif", "business", "budget", "croissance", "contrainte", "échéance", "stade"],
};

/**
 * Score de complétude [0,1] = proportion des 5 dimensions détectées dans le texte.
 * Fonction pure — aucune dépendance externe.
 */
export function scoreDiscoveryCompleteness(output: string): number {
  const text = (output ?? "").toLowerCase();
  if (!text) return 0;
  let covered = 0;
  for (const dim of DISCOVERY_DIMENSIONS) {
    if (DIMENSION_SIGNALS[dim].some((kw) => text.includes(kw))) covered += 1;
  }
  return covered / DISCOVERY_DIMENSIONS.length;
}

/** Extrait un texte exploitable depuis l'input/sortie du run de scoring. */
function extractOutputText(run: unknown): string {
  const r = run as { output?: unknown };
  const out = r.output;
  if (typeof out === "string") return out;
  if (Array.isArray(out)) {
    return out
      .map((m) => (typeof m === "string" ? m : (m as { content?: string })?.content ?? ""))
      .join("\n");
  }
  if (out && typeof out === "object") {
    const o = out as { text?: string; content?: string };
    return o.text ?? o.content ?? JSON.stringify(out);
  }
  return "";
}

export const discoveryCompletenessScorer = createScorer({
  id: "discovery-completeness",
  name: "discovery-completeness",
  description:
    "Mesure la proportion des 5 blocs BusinessDiscovery (problème, proposition de valeur, audiences, marketing, contexte business) couverts par la réponse.",
}).generateScore(({ run }) => scoreDiscoveryCompleteness(extractOutputText(run)));
