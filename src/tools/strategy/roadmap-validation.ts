// ============================================================
// Tool 7: validateRoadmap (GATE Strategy → Tactics, uses Haiku)
// ============================================================

import { recordEpisodeUseCase } from "@/infrastructure/composition-root";
import type {
  TargetMarket,
  BusinessStrategy,
  MarketingFoundation,
  FeedbackLoop,
  OKR,
  RoadmapValidation,
} from "@/types/marketing-strategy";
import { callClaudeHaiku, extractJsonFromResponse } from "@/tools/discovery/index";

interface ValidateRoadmapInput {
  targetMarket: TargetMarket;
  businessStrategy: BusinessStrategy;
  marketingFoundation: MarketingFoundation;
  feedbackLoop: FeedbackLoop;
  okrs: OKR[];
}

export async function validateRoadmap(
  input: ValidateRoadmapInput
): Promise<RoadmapValidation> {
  const { targetMarket, businessStrategy, marketingFoundation, feedbackLoop, okrs } = input;

  const prompt = `Tu es un directeur marketing senior. Évalue si cette stratégie marketing est suffisamment solide pour passer à la phase tactique.

## Les 4 réponses stratégiques

1. QUI on aide : ${targetMarket.marketDefinition}
   - Segments : ${targetMarket.segments.map((s) => `${s.segment} (${s.priority})`).join(", ")}
   - ICP : ${targetMarket.icp.description}

2. QUEL PROBLÈME on résout : ${businessStrategy.transformation.before} → ${businessStrategy.transformation.after}
   - Proposition de valeur : ${businessStrategy.valueProposition}

3. COMMENT on se différencie : ${businessStrategy.uniqueDifferentiator}
   - Angle concurrentiel : ${businessStrategy.competitiveAngle}

4. CE QU'ON DIT : ${marketingFoundation.messaging.primaryMessage}
   - Positionnement : ${marketingFoundation.positioning.uniqueValue}

## OKRs (${okrs.length})
${okrs.map((o) => `- [${o.priority}] ${o.objective}`).join("\n")}

## Hypothèses à valider (${feedbackLoop.hypotheses.length})
${feedbackLoop.hypotheses.map((h) => `- ${h}`).join("\n")}

## Évaluation demandée
Évalue chaque question stratégique (clarté, cohérence, faisabilité). Donne un score global de readiness (0-100).

Règles :
- Score < 50 → "rethink" (la stratégie a des trous fondamentaux)
- Score 50-75 → "refine" (quelques ajustements nécessaires)
- Score > 75 → "proceed" (prêt pour les tactiques)
- Identifie les gaps spécifiques s'il y en a

Réponds en JSON strict :
{
  "strategySummary": {
    "whoWeHelp": "...",
    "whatProblem": "...",
    "howWeDiffer": "...",
    "whatWeSay": "..."
  },
  "readinessScore": 85,
  "gaps": [],
  "recommendation": "proceed"
}`;

  const responseText = await callClaudeHaiku(prompt, 1024);
  const result = extractJsonFromResponse<RoadmapValidation>(responseText);

  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Roadmap Validation — score ${result.readinessScore}/100, recommendation: ${result.recommendation}`,
    data: { roadmapValidation: result },
    tags: ["strategy", "roadmap-validation", "gate"],
    importance: "high",
  });

  return result;
}
