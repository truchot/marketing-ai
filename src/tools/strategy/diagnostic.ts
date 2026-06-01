// ============================================================
// Tool 1: generateDiagnostic (STRATÉGIQUE)
// ============================================================

import { recordEpisodeUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type { MarketingDiagnostic } from "@/types/marketing-strategy";
import { callClaudeHaiku, extractJsonFromResponse } from "@/tools/discovery/index";
import { calculateMaturityScore } from "./maturity-score";

interface GenerateDiagnosticInput {
  discovery: BusinessDiscovery;
}

export async function generateDiagnostic(
  input: GenerateDiagnosticInput
): Promise<MarketingDiagnostic> {
  const { discovery } = input;

  const maturityScore = calculateMaturityScore(discovery);

  // --- Generate SWOT via Claude Haiku (extraction task, not strategic reasoning) ---
  const swotPrompt = `Tu es un analyste marketing senior. Analyse ce diagnostic de découverte business et produis un SWOT concis.

Données de découverte :
- Entreprise : ${discovery.metadata.companyName} (${discovery.metadata.sector})
- Stade : ${discovery.businessContext.stage} — ${discovery.businessContext.stageDetails}
- Problème : ${discovery.problem.statement} (douleur : ${discovery.problem.painLevel})
- Proposition de valeur : avant="${discovery.valueProposition.transformation.before}" → après="${discovery.valueProposition.transformation.after}"
- Différenciateur : ${discovery.valueProposition.uniqueDifferentiator}
- Audiences : ${discovery.audiences.map((a) => `${a.segment} (${a.priority})`).join(", ")}
- Canaux actifs : ${discovery.currentMarketing.channels.map((c) => `${c.name} (${c.perceivedResults})`).join(", ")}
- Canaux abandonnés : ${discovery.currentMarketing.abandonedChannels.map((c) => c.name).join(", ") || "aucun"}
- Meilleur canal : ${discovery.currentMarketing.bestPerforming || "inconnu"}
- Plus gros gap : ${discovery.currentMarketing.biggestGap || "inconnu"}
- Équipe : ${discovery.currentMarketing.team.size} pers., skills: ${discovery.currentMarketing.team.skills.join(", ")}, gaps: ${discovery.currentMarketing.team.gaps.join(", ")}
- Budget : ${discovery.currentMarketing.budget.range} (${discovery.currentMarketing.budget.flexibility})
- Objectif principal : ${discovery.businessContext.primaryGoal.description}
- Contraintes : ${discovery.businessContext.constraints.map((c) => `${c.type}: ${c.description} (${c.severity})`).join("; ")}
- Score maturité marketing : ${maturityScore}/100

Réponds en JSON strict :
{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "opportunities": ["...", "..."],
  "threats": ["...", "..."],
  "summary": "Synthèse en 3-5 lignes"
}

Maximum 3 éléments par catégorie. Sois concis et actionnable.`;

  const responseText = await callClaudeHaiku(swotPrompt, 1024);
  const swot = extractJsonFromResponse<{
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
    summary?: string;
  }>(responseText);

  const diagnostic: MarketingDiagnostic = {
    maturityScore,
    strengths: swot.strengths || [],
    weaknesses: swot.weaknesses || [],
    opportunities: swot.opportunities || [],
    threats: swot.threats || [],
    summary: swot.summary || `Score de maturité marketing : ${maturityScore}/100.`,
  };

  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Diagnostic marketing généré pour ${discovery.metadata.companyName} — score ${maturityScore}/100`,
    data: { diagnostic, companyName: discovery.metadata.companyName },
    tags: ["strategy", "diagnostic", "swot"],
    importance: "medium",
  });

  return diagnostic;
}
