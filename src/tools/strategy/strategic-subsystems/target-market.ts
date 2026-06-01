// ============================================================
// Tool 2: analyzeTargetMarket (Subsystem 1)
// ============================================================

import { recordEpisodeUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type { MarketingDiagnostic, TargetMarket } from "@/types/marketing-strategy";
import { callClaudeSonnet, extractJsonFromResponse } from "@/tools/discovery/index";

interface AnalyzeTargetMarketInput {
  discovery: BusinessDiscovery;
  diagnostic: MarketingDiagnostic;
}

export async function analyzeTargetMarket(
  input: AnalyzeTargetMarketInput
): Promise<TargetMarket> {
  const { discovery, diagnostic } = input;

  const prompt = `Tu es un stratège marketing senior. Analyse le marché cible et construis un profil client idéal (ICP) à partir de ces données de découverte.

## Données discovery
- Entreprise : ${discovery.metadata.companyName} (${discovery.metadata.sector}, stade: ${discovery.businessContext.stage})
- Problème : ${discovery.problem.statement} (douleur : ${discovery.problem.painLevel})
- Audiences identifiées :
${discovery.audiences.map((a) => `  - ${a.segment} (${a.priority}) : douleur="${a.painIntensity}", trigger="${a.triggerMoment}", contexte achat="${a.buyingContext}", canaux=[${a.channels.join(", ")}], objections=[${a.objections.map((o) => o.objection).join(", ")}]${a.decisionProcess ? `, décideurs=[${a.decisionProcess.decisionMakers.join(", ")}], cycle=${a.decisionProcess.averageCycleLength}` : ""}`).join("\n")}
- Diagnostic : score ${diagnostic.maturityScore}/100, forces=[${diagnostic.strengths.join(", ")}]

## Règles
- Identifie le marché cible global
- Priorise les segments (primary/secondary)
- Le ICP doit être basé sur l'audience prioritaire
- Inclus au moins 2-3 pain points concrets
- Les trigger moments doivent être des situations réelles, pas des généralités

Réponds en JSON strict :
{
  "marketDefinition": "...",
  "segments": [
    { "segment": "...", "priority": "primary", "mainPain": "...", "targetMessage": "..." }
  ],
  "icp": {
    "description": "...",
    "painPoints": ["..."],
    "triggerMoments": ["..."],
    "buyingContext": "...",
    "preferredChannels": ["..."],
    "commonObjections": ["..."],
    "decisionCriteria": ["..."]
  }
}`;

  const responseText = await callClaudeSonnet(prompt);
  const result = extractJsonFromResponse<TargetMarket>(responseText);

  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Marché cible analysé pour ${discovery.metadata.companyName} — ${result.segments?.length || 0} segment(s)`,
    data: { targetMarket: result },
    tags: ["strategy", "target-market", "icp"],
    importance: "high",
  });

  return result;
}
