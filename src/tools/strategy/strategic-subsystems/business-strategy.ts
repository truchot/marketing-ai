// ============================================================
// Tool 3: defineBusinessStrategy (Subsystem 2)
// ============================================================

import { recordEpisodeUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type { MarketingDiagnostic, TargetMarket, BusinessStrategy } from "@/types/marketing-strategy";
import { callClaudeSonnet, extractJsonFromResponse } from "@/tools/discovery/index";

interface DefineBusinessStrategyInput {
  discovery: BusinessDiscovery;
  diagnostic: MarketingDiagnostic;
  targetMarket: TargetMarket;
}

export async function defineBusinessStrategy(
  input: DefineBusinessStrategyInput
): Promise<BusinessStrategy> {
  const { discovery, diagnostic, targetMarket } = input;

  const prompt = `Tu es un stratège marketing senior. Définis la stratégie business : vision, proposition de valeur, différenciateur et angle concurrentiel.

## Données discovery
- Entreprise : ${discovery.metadata.companyName} (${discovery.metadata.sector})
- Stade : ${discovery.businessContext.stage} — ${discovery.businessContext.stageDetails}
- Problème : ${discovery.problem.statement} (${discovery.problem.painLevel})
- Transformation : avant="${discovery.valueProposition.transformation.before}" → après="${discovery.valueProposition.transformation.after}" (en ${discovery.valueProposition.transformation.timeToValue})
- Différenciateur : ${discovery.valueProposition.uniqueDifferentiator}
- Alternatives actuelles : ${discovery.problem.currentAlternatives.map((a) => `${a.alternative} (limites: ${a.limitations})`).join("; ")}
- Preuves : ${discovery.valueProposition.proofPoints.map((p) => `${p.type}: ${p.description} (${p.verified ? "vérifié" : "claim"})`).join("; ")}
- Objectif principal : ${discovery.businessContext.primaryGoal.description}

## Marché cible validé
- Marché : ${targetMarket.marketDefinition}
- ICP : ${targetMarket.icp.description}
- Segment primaire : ${targetMarket.segments.find((s) => s.priority === "primary")?.segment || "non défini"}

## Diagnostic
- Score : ${diagnostic.maturityScore}/100
- Forces : ${diagnostic.strengths.join(", ")}
- Opportunités : ${diagnostic.opportunities.join(", ")}

## Règles
- La vision doit être inspirante et à horizon 12-18 mois
- La proposition de valeur doit être en une phrase claire
- L'angle concurrentiel doit être défendable
- Le stade business doit influencer la stratégie

Réponds en JSON strict :
{
  "vision": "...",
  "valueProposition": "...",
  "transformation": { "before": "...", "after": "...", "timeToValue": "..." },
  "uniqueDifferentiator": "...",
  "competitiveAngle": "...",
  "businessStage": "${discovery.businessContext.stage}"
}`;

  const responseText = await callClaudeSonnet(prompt);
  const result = extractJsonFromResponse<BusinessStrategy>(responseText);

  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Stratégie business définie pour ${discovery.metadata.companyName}`,
    data: { businessStrategy: result },
    tags: ["strategy", "business-strategy", "value-proposition"],
    importance: "high",
  });

  return result;
}
