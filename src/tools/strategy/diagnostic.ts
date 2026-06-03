// ============================================================
// Tool 1: generateDiagnostic (STRATÉGIQUE)
// ============================================================

import { recordEpisodeUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type { MarketingDiagnostic } from "@/types/marketing-strategy";
import { callClaudeHaiku, extractJsonFromResponse } from "@/tools/discovery/index";
import { calculateMaturityScore } from "./maturity-score";
import {
  assessMarketingProblems,
  mergeProblemRefinements,
  selectCriticalProblems,
  type ProblemRefinement,
} from "./problem-assessment";

interface GenerateDiagnosticInput {
  discovery: BusinessDiscovery;
}

export async function generateDiagnostic(
  input: GenerateDiagnosticInput
): Promise<MarketingDiagnostic> {
  const { discovery } = input;

  const maturityScore = calculateMaturityScore(discovery);

  // --- Deterministic assessment of the 16 marketing problems ---
  const problems = assessMarketingProblems(discovery);
  // Only the non-measured problems are handed to the LLM for refinement.
  const refinable = problems.filter((p) => p.dataSufficiency !== "measured");
  const refinementList = refinable
    .map((p) => `- ${p.key} — ${p.label} (actuel : ${p.severity})`)
    .join("\n");

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
- Synthèse : ${discovery.narrativeSummary}
- Hypothèses stratégiques : ${discovery.strategicHypotheses.join(" | ") || "aucune"}

## Affinage des problèmes marketing
Les problèmes ci-dessous ne peuvent pas être tranchés par les seules données chiffrées. Pour CHACUN, évalue la sévérité réelle à partir du contexte narratif. Si l'information manque vraiment, laisse "dataSufficiency": "insufficient" — n'invente JAMAIS une sévérité.
Barème de sévérité (du plus facile au plus grave) : "easily_fixed" < "normal" < "problematic" < "deep" < "critical".
${refinementList || "(aucun à affiner)"}

Réponds en JSON strict :
{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "opportunities": ["...", "..."],
  "threats": ["...", "..."],
  "summary": "Synthèse en 3-5 lignes",
  "problemRefinements": [
    { "key": "<clé ci-dessus>", "severity": "normal", "confidence": "low|medium|high", "evidence": "preuve courte tirée du contexte", "dataSufficiency": "inferred|insufficient" }
  ]
}

Maximum 3 éléments par catégorie SWOT. Sois concis et actionnable.`;

  const responseText = await callClaudeHaiku(swotPrompt, 2048);
  const swot = extractJsonFromResponse<{
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
    summary?: string;
    problemRefinements?: ProblemRefinement[];
  }>(responseText);

  const refinedProblems = mergeProblemRefinements(problems, swot.problemRefinements ?? []);
  const criticalProblems = selectCriticalProblems(refinedProblems);

  const diagnostic: MarketingDiagnostic = {
    maturityScore,
    problems: refinedProblems,
    criticalProblems,
    strengths: swot.strengths || [],
    weaknesses: swot.weaknesses || [],
    opportunities: swot.opportunities || [],
    threats: swot.threats || [],
    summary: swot.summary || `Score de maturité marketing : ${maturityScore}/100.`,
  };

  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Diagnostic marketing généré pour ${discovery.metadata.companyName} — score ${maturityScore}/100, ${criticalProblems.length} problème(s) critique(s)`,
    data: { diagnostic, companyName: discovery.metadata.companyName },
    tags: ["strategy", "diagnostic", "swot", "problems"],
    importance: "medium",
  });

  return diagnostic;
}
