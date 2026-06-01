// ============================================================
// Strategy Tools Implementation
// Takes BusinessDiscovery as input and produces OKRs + Actions
// ============================================================

import {
  recordEpisodeUseCase,
  addClientFactUseCase,
  saveStrategyUseCase,
} from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type {
  MarketingDiagnostic,
  OKR,
  Action,
  MarketingStrategy,
} from "@/types/marketing-strategy";
import {
  callClaudeHaiku,
  callClaudeSonnet,
  extractJsonFromResponse,
} from "@/tools/discovery/index";

// ============================================================
// Tool 1: generateDiagnostic
// ============================================================

interface GenerateDiagnosticInput {
  discovery: BusinessDiscovery;
}

export async function generateDiagnostic(
  input: GenerateDiagnosticInput
): Promise<MarketingDiagnostic> {
  const { discovery } = input;

  // --- Calculate maturity score (5 dimensions × 20 pts) ---

  // 1. Channels (0-20)
  const activeChannels = discovery.currentMarketing.channels.length;
  const goodChannels = discovery.currentMarketing.channels.filter(
    (c) => c.perceivedResults === "good"
  ).length;
  const channelScore = Math.min(20, activeChannels * 4 + goodChannels * 4);

  // 2. Team (0-20)
  const teamSize = discovery.currentMarketing.team.size;
  const dedicated = discovery.currentMarketing.team.dedicatedToMarketing;
  const skillCount = discovery.currentMarketing.team.skills.length;
  const gapCount = discovery.currentMarketing.team.gaps.length;
  const teamScore = Math.min(
    20,
    (dedicated ? 8 : 3) + Math.min(teamSize * 2, 6) + Math.max(0, (skillCount - gapCount) * 2)
  );

  // 3. Tools (0-20)
  const tools = discovery.currentMarketing.tools;
  const wellConfigured = tools.filter((t) => t.maturity === "well_configured").length;
  const underused = tools.filter((t) => t.maturity === "underused").length;
  const toolScore = Math.min(20, wellConfigured * 6 + underused * 2 + tools.length);

  // 4. Budget (0-20) — uses flexibility + range presence
  const flexibility = discovery.currentMarketing.budget.flexibility;
  const hasRange = discovery.currentMarketing.budget.range.length > 0;
  const hasAllocation = discovery.currentMarketing.budget.allocation.length > 0;
  const budgetScore =
    (flexibility === "adjustable" ? 12 : flexibility === "fixed" ? 6 : 2) +
    (hasRange ? 4 : 0) +
    (hasAllocation ? 4 : 0);

  // 5. Strategy (0-20)
  const hasMetric = discovery.businessContext.primaryGoal.metric !== null;
  const hasTimeline = discovery.businessContext.primaryGoal.timeline.length > 0;
  const hasEvents = discovery.businessContext.upcomingEvents.length > 0;
  const strategyScore =
    (hasMetric ? 8 : 0) + (hasTimeline ? 6 : 0) + (hasEvents ? 4 : 2);

  const maturityScore = channelScore + teamScore + toolScore + budgetScore + strategyScore;

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

  // Store diagnostic as episode
  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Diagnostic marketing généré pour ${discovery.metadata.companyName} — score ${maturityScore}/100`,
    data: { diagnostic, companyName: discovery.metadata.companyName },
    tags: ["strategy", "diagnostic", "swot"],
    importance: "medium",
  });

  return diagnostic;
}

// ============================================================
// Tool 2: proposeOKR (uses Sonnet for strategic reasoning)
// ============================================================

interface ProposeOKRInput {
  discovery: BusinessDiscovery;
  diagnostic: MarketingDiagnostic;
  existingOKRs: OKR[];
}

export async function proposeOKRs(
  input: ProposeOKRInput
): Promise<OKR[]> {
  const { discovery, diagnostic, existingOKRs } = input;

  const existingObjectives = existingOKRs.map((o) => o.objective).join(", ") || "aucun";

  const prompt = `Tu es un stratège marketing senior. Génère 2-3 OKR marketing basés sur ce diagnostic.

## Contexte
- Entreprise : ${discovery.metadata.companyName} (${discovery.metadata.sector}, stade: ${discovery.businessContext.stage})
- Objectif principal : ${discovery.businessContext.primaryGoal.description} (metric: ${discovery.businessContext.primaryGoal.metric || "non défini"}, timeline: ${discovery.businessContext.primaryGoal.timeline})
- Score maturité : ${diagnostic.maturityScore}/100
- Forces : ${diagnostic.strengths.join(", ")}
- Faiblesses : ${diagnostic.weaknesses.join(", ")}
- Opportunités : ${diagnostic.opportunities.join(", ")}
- Audience primaire : ${discovery.audiences.find((a) => a.priority === "primary")?.segment || "non définie"}
- Budget : ${discovery.currentMarketing.budget.range} (${discovery.currentMarketing.budget.flexibility})
- Équipe : ${discovery.currentMarketing.team.size} pers. (dédiée: ${discovery.currentMarketing.team.dedicatedToMarketing})
- Urgence : ${discovery.businessContext.urgency}
- Contraintes : ${discovery.businessContext.constraints.map((c) => `${c.type}: ${c.description}`).join("; ")}
- OKR déjà proposés : ${existingObjectives}
- Hypothèses stratégiques (du discovery) : ${discovery.strategicHypotheses.join("; ")}

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

  // Ensure it's an array
  const okrArray = Array.isArray(okrs) ? okrs : [okrs];

  // Store as episode
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
// Tool 3: proposeActions (uses Sonnet for strategic reasoning)
// ============================================================

interface ProposeActionsInput {
  discovery: BusinessDiscovery;
  okr: OKR;
}

export async function proposeActions(
  input: ProposeActionsInput
): Promise<Action[]> {
  const { discovery, okr } = input;

  const prompt = `Tu es un stratège marketing senior. Génère des actions concrètes pour cet OKR.

## OKR
- Objectif : ${okr.objective}
- Key Results : ${okr.keyResults.map((kr) => `${kr.metric} → ${kr.target} (${kr.timeline})`).join("; ")}

## Contexte entreprise
- ${discovery.metadata.companyName} (${discovery.metadata.sector}, stade: ${discovery.businessContext.stage})
- Équipe : ${discovery.currentMarketing.team.size} pers., skills: ${discovery.currentMarketing.team.skills.join(", ")}, gaps: ${discovery.currentMarketing.team.gaps.join(", ")}
- Budget : ${discovery.currentMarketing.budget.range} (${discovery.currentMarketing.budget.flexibility})
- Outils actuels : ${discovery.currentMarketing.tools.map((t) => `${t.name} (${t.maturity})`).join(", ")}
- Canaux actifs : ${discovery.currentMarketing.channels.map((c) => `${c.name} (${c.perceivedResults})`).join(", ")}
- Canaux abandonnés : ${discovery.currentMarketing.abandonedChannels.map((c) => `${c.name}: ${c.reason}`).join("; ") || "aucun"}
- Contraintes : ${discovery.businessContext.constraints.map((c) => `${c.type}: ${c.description} (${c.severity})`).join("; ")}

## Règles
- 3-4 actions par OKR
- Au moins 1 quick_win (low effort, high impact)
- Chaque action liée à un Key Result spécifique
- Actions réalistes pour la taille de l'équipe et le budget
- Ne recommande PAS un canal abandonné sauf si tu justifies clairement

Réponds en JSON strict :
[
  {
    "id": "action-1",
    "okrId": "${okr.id}",
    "keyResultId": "${okr.keyResults[0]?.id || "kr-1"}",
    "title": "...",
    "description": "...",
    "type": "quick_win",
    "effort": "low",
    "impact": "high",
    "requiredSkills": ["..."],
    "requiredTools": ["..."],
    "dependencies": [],
    "suggestedTimeline": "Semaine 1-2",
    "channel": "...",
    "audienceSegment": "..."
  }
]`;

  const responseText = await callClaudeSonnet(prompt);
  const actions = extractJsonFromResponse<Action[]>(responseText);

  return Array.isArray(actions) ? actions : [actions];
}

// ============================================================
// Tool 4: saveStrategy — delegates to SaveStrategyUseCase
// ============================================================

interface SaveStrategyOutput {
  success: boolean;
  message: string;
  strategyId: string;
}

export async function saveStrategy(
  strategy: MarketingStrategy
): Promise<SaveStrategyOutput> {
  // Delegate to use case (validates invariants via aggregate, persists via repository)
  const result = await saveStrategyUseCase.execute(strategy);

  if (result.isErr()) {
    return {
      success: false,
      message: result.error.message,
      strategyId: "",
    };
  }

  const strategyId = result.value;

  // Also store key strategic facts in semantic memory for cross-phase retrieval
  for (const okr of strategy.okrs) {
    addClientFactUseCase.execute({
      category: "strategy",
      fact: `OKR ${okr.priority}: ${okr.objective}`,
      source: "strategy_agent",
    });

    for (const kr of okr.keyResults) {
      addClientFactUseCase.execute({
        category: "strategy",
        fact: `KR: ${kr.metric} — cible ${kr.target} (${kr.timeline})`,
        source: "strategy_agent",
      });
    }
  }

  addClientFactUseCase.execute({
    category: "strategy",
    fact: `Score maturité marketing: ${strategy.diagnostic.maturityScore}/100`,
    source: "strategy_agent",
  });

  return {
    success: true,
    message: `Stratégie sauvegardée : ${strategy.okrs.length} OKR, ${strategy.actions.length} actions.`,
    strategyId,
  };
}

// ============================================================
// Tool 5: adjustOKR (uses Haiku — lightweight adjustment task)
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
