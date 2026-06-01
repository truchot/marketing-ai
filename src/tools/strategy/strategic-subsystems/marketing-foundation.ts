// ============================================================
// Tool 4: defineMarketingFoundation (Subsystem 4)
// ============================================================

import { recordEpisodeUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type { TargetMarket, BusinessStrategy, MarketingFoundation } from "@/types/marketing-strategy";
import { callClaudeSonnet, extractJsonFromResponse } from "@/tools/discovery/index";

interface DefineMarketingFoundationInput {
  discovery: BusinessDiscovery;
  targetMarket: TargetMarket;
  businessStrategy: BusinessStrategy;
}

export async function defineMarketingFoundation(
  input: DefineMarketingFoundationInput
): Promise<MarketingFoundation> {
  const { discovery, targetMarket, businessStrategy } = input;

  const prompt = `Tu es un stratège marketing senior. Définis la fondation marketing : offre, positionnement et messaging par segment.

## Stratégie business validée
- Vision : ${businessStrategy.vision}
- Proposition de valeur : ${businessStrategy.valueProposition}
- Différenciateur : ${businessStrategy.uniqueDifferentiator}
- Angle concurrentiel : ${businessStrategy.competitiveAngle}

## Marché cible validé
- Marché : ${targetMarket.marketDefinition}
- Segments : ${targetMarket.segments.map((s) => `${s.segment} (${s.priority}): "${s.mainPain}"`).join("; ")}
- ICP : ${targetMarket.icp.description}
- Objections : ${targetMarket.icp.commonObjections.join(", ")}

## Données discovery
- Langage des audiences : ${discovery.audiences.map((a) => `${a.segment}: [${a.language.join(", ")}]`).join("; ")}
- Preuves : ${discovery.valueProposition.proofPoints.map((p) => `${p.type}: ${p.description}`).join("; ")}
- Meilleur canal actuel : ${discovery.currentMarketing.bestPerforming || "inconnu"}

## Règles
- L'offre doit être formulée du point de vue client
- Le positionnement doit être clair et différenciant
- Le message principal doit être en une phrase
- Chaque segment doit avoir un message adapté avec un ton spécifique
- Les proof points doivent être des faits vérifiables

Réponds en JSON strict :
{
  "offer": "...",
  "positioning": {
    "targetMarket": "...",
    "uniqueValue": "...",
    "competitiveAngle": "...",
    "brandPersonality": "..."
  },
  "messaging": {
    "primaryMessage": "...",
    "segmentMessages": [
      { "segment": "...", "message": "...", "tone": "..." }
    ],
    "proofPoints": ["..."]
  }
}`;

  const responseText = await callClaudeSonnet(prompt);
  const result = extractJsonFromResponse<MarketingFoundation>(responseText);

  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Fondation marketing définie pour ${discovery.metadata.companyName}`,
    data: { marketingFoundation: result },
    tags: ["strategy", "marketing-foundation", "messaging"],
    importance: "high",
  });

  return result;
}
