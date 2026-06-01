// ============================================================
// Tools 6 & 11: OKR proposal and adjustment
// ============================================================

import { recordEpisodeUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type {
  MarketingDiagnostic,
  OKR,
  TargetMarket,
  BusinessStrategy,
  MarketingFoundation,
  FeedbackLoop,
} from "@/types/marketing-strategy";
import {
  callClaudeHaiku,
  callClaudeSonnet,
  extractJsonFromResponse,
} from "@/tools/discovery/index";

// ============================================================
// Tool 6: proposeOKRs (uses Sonnet)
// ============================================================

interface ProposeOKRInput {
  discovery: BusinessDiscovery;
  diagnostic: MarketingDiagnostic;
  existingOKRs: OKR[];
  targetMarket?: TargetMarket;
  businessStrategy?: BusinessStrategy;
  marketingFoundation?: MarketingFoundation;
  feedbackLoop?: FeedbackLoop;
}

export async function proposeOKRs(
  input: ProposeOKRInput
): Promise<OKR[]> {
  const { discovery, diagnostic, existingOKRs, targetMarket, businessStrategy, marketingFoundation, feedbackLoop } = input;

  const existingObjectives = existingOKRs.map((o) => o.objective).join(", ") || "aucun";

  const subsystemContext = [
    targetMarket ? `\n## Marché cible validé\n- Marché : ${targetMarket.marketDefinition}\n- ICP : ${targetMarket.icp.description}\n- Segments : ${targetMarket.segments.map((s) => `${s.segment} (${s.priority})`).join(", ")}` : "",
    businessStrategy ? `\n## Stratégie business validée\n- Vision : ${businessStrategy.vision}\n- Proposition de valeur : ${businessStrategy.valueProposition}\n- Différenciateur : ${businessStrategy.uniqueDifferentiator}\n- Angle : ${businessStrategy.competitiveAngle}` : "",
    marketingFoundation ? `\n## Fondation marketing validée\n- Message principal : ${marketingFoundation.messaging.primaryMessage}\n- Positionnement : ${marketingFoundation.positioning.uniqueValue}` : "",
    feedbackLoop ? `\n## Hypothèses à valider\n${feedbackLoop.hypotheses.map((h) => `- ${h}`).join("\n")}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `Tu es un stratège marketing senior. Génère 2-3 OKR marketing basés sur le diagnostic et les sous-systèmes stratégiques validés.

## Contexte
- Entreprise : ${discovery.metadata.companyName} (${discovery.metadata.sector}, stade: ${discovery.businessContext.stage})
- Objectif principal : ${discovery.businessContext.primaryGoal.description} (metric: ${discovery.businessContext.primaryGoal.metric || "non défini"}, timeline: ${discovery.businessContext.primaryGoal.timeline})
- Score maturité : ${diagnostic.maturityScore}/100
- Forces : ${diagnostic.strengths.join(", ")}
- Faiblesses : ${diagnostic.weaknesses.join(", ")}
- Opportunités : ${diagnostic.opportunities.join(", ")}
- Budget : ${discovery.currentMarketing.budget.range} (${discovery.currentMarketing.budget.flexibility})
- Équipe : ${discovery.currentMarketing.team.size} pers. (dédiée: ${discovery.currentMarketing.team.dedicatedToMarketing})
- Urgence : ${discovery.businessContext.urgency}
- Contraintes : ${discovery.businessContext.constraints.map((c) => `${c.type}: ${c.description}`).join("; ")}
- OKR déjà proposés : ${existingObjectives}
${subsystemContext}

## Règles
- Maximum 3 OKR, minimum 2
- 1 OKR "primary", les autres "secondary"
- Chaque OKR doit avoir 2-3 Key Results mesurables
- Chaque KR doit avoir un target et un timeline réalistes
- Lie chaque OKR à un bloc du discovery (problem_value, audience, marketing_landscape, business_context)
- Adapte au stade : ${discovery.businessContext.stage}

Réponds en JSON strict :
[
  {
    "id": "okr-1",
    "objective": "...",
    "rationale": "...",
    "keyResults": [
      { "id": "kr-1-1", "metric": "...", "current": null, "target": "...", "timeline": "...", "confidence": "medium" }
    ],
    "priority": "primary",
    "linkedDiscoveryData": { "fromBlock": "business_context", "evidence": "..." }
  }
]`;

  const responseText = await callClaudeSonnet(prompt);
  const okrs = extractJsonFromResponse<OKR[]>(responseText);

  const okrArray = Array.isArray(okrs) ? okrs : [okrs];

  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `${okrArray.length} OKR proposés pour ${discovery.metadata.companyName}`,
    data: { okrs: okrArray },
    tags: ["strategy", "okr", "proposal"],
    importance: "high",
  });

  return okrArray;
}

// ============================================================
// Tool 11: adjustOKR (uses Haiku — lightweight adjustment)
// ============================================================

interface AdjustOKRInput {
  okr: OKR;
  adjustment: string;
  discovery: BusinessDiscovery;
}

export async function adjustOKR(
  input: AdjustOKRInput
): Promise<OKR> {
  const { okr, adjustment, discovery } = input;

  const prompt = `Tu es un stratège marketing. Ajuste cet OKR selon le feedback client.

## OKR actuel
${JSON.stringify(okr, null, 2)}

## Feedback client
${adjustment}

## Contexte
- Entreprise : ${discovery.metadata.companyName} (${discovery.metadata.sector})
- Stade : ${discovery.businessContext.stage}
- Objectif principal : ${discovery.businessContext.primaryGoal.description}

Retourne l'OKR ajusté en JSON strict, même format que l'input.`;

  const responseText = await callClaudeHaiku(prompt, 1024);
  return extractJsonFromResponse<OKR>(responseText);
}
