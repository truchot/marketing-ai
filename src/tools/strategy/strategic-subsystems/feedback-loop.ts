// ============================================================
// Tool 5: defineFeedbackLoop (Subsystem 3, uses Haiku)
// ============================================================

import { recordEpisodeUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type { BusinessStrategy, MarketingFoundation, FeedbackLoop } from "@/types/marketing-strategy";
import { callClaudeHaiku, extractJsonFromResponse } from "@/tools/discovery/index";

interface DefineFeedbackLoopInput {
  discovery: BusinessDiscovery;
  businessStrategy: BusinessStrategy;
  marketingFoundation: MarketingFoundation;
}

export async function defineFeedbackLoop(
  input: DefineFeedbackLoopInput
): Promise<FeedbackLoop> {
  const { discovery, businessStrategy, marketingFoundation } = input;

  const prompt = `Tu es un stratège marketing. Définis la boucle de feedback : hypothèses à valider, mécanismes de test, cadence de review et conditions de pivot.

## Hypothèses stratégiques du discovery
${discovery.strategicHypotheses.map((h, i) => `${i + 1}. ${h}`).join("\n")}

## Stratégie business
- Vision : ${businessStrategy.vision}
- Proposition de valeur : ${businessStrategy.valueProposition}
- Stade : ${businessStrategy.businessStage}

## Fondation marketing
- Message principal : ${marketingFoundation.messaging.primaryMessage}
- Positionnement : ${marketingFoundation.positioning.uniqueValue}

## Contexte
- Urgence : ${discovery.businessContext.urgency}
- Contraintes : ${discovery.businessContext.constraints.map((c) => `${c.type}: ${c.description} (${c.severity})`).join("; ")}
- Outils analytics disponibles : ${discovery.currentMarketing.tools.filter((t) => t.category === "analytics").map((t) => t.name).join(", ") || "aucun identifié"}

## Règles
- Reprends et enrichis les hypothèses du discovery
- Chaque hypothèse doit avoir un test de validation concret
- La cadence de review doit être adaptée à l'urgence
- Les conditions de pivot doivent être des seuils mesurables

Réponds en JSON strict :
{
  "hypotheses": ["..."],
  "validationTests": [
    {
      "hypothesis": "...",
      "metric": "...",
      "method": "...",
      "successCriteria": "...",
      "timeline": "...",
      "status": "untested",
      "linkedKpiIds": []
    }
  ],
  "reviewCadence": "...",
  "pivotTriggers": ["..."]
}`;

  const responseText = await callClaudeHaiku(prompt, 1024);
  const result = extractJsonFromResponse<FeedbackLoop>(responseText);

  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Boucle de feedback définie — ${result.hypotheses?.length || 0} hypothèse(s)`,
    data: { feedbackLoop: result },
    tags: ["strategy", "feedback-loop", "hypotheses"],
    importance: "medium",
  });

  return result;
}
