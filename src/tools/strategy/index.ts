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
  const swotPrompt = `You are a senior marketing analyst. Analyze this business discovery diagnostic and produce a concise SWOT.

Discovery data:
- Company: ${discovery.metadata.companyName} (${discovery.metadata.sector})
- Stage: ${discovery.businessContext.stage} — ${discovery.businessContext.stageDetails}
- Problem: ${discovery.problem.statement} (pain: ${discovery.problem.painLevel})
- Value proposition: before="${discovery.valueProposition.transformation.before}" → after="${discovery.valueProposition.transformation.after}"
- Differentiator: ${discovery.valueProposition.uniqueDifferentiator}
- Audiences: ${discovery.audiences.map((a) => `${a.segment} (${a.priority})`).join(", ")}
- Active channels: ${discovery.currentMarketing.channels.map((c) => `${c.name} (${c.perceivedResults})`).join(", ")}
- Abandoned channels: ${discovery.currentMarketing.abandonedChannels.map((c) => c.name).join(", ") || "none"}
- Best performing channel: ${discovery.currentMarketing.bestPerforming || "unknown"}
- Biggest gap: ${discovery.currentMarketing.biggestGap || "unknown"}
- Team: ${discovery.currentMarketing.team.size} people, skills: ${discovery.currentMarketing.team.skills.join(", ")}, gaps: ${discovery.currentMarketing.team.gaps.join(", ")}
- Budget: ${discovery.currentMarketing.budget.range} (${discovery.currentMarketing.budget.flexibility})
- Primary goal: ${discovery.businessContext.primaryGoal.description}
- Constraints: ${discovery.businessContext.constraints.map((c) => `${c.type}: ${c.description} (${c.severity})`).join("; ")}
- Marketing maturity score: ${maturityScore}/100

Respond in strict JSON:
{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "opportunities": ["...", "..."],
  "threats": ["...", "..."],
  "summary": "Summary in 3-5 lines"
}

Maximum 3 items per category. Be concise and actionable.`;

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
    summary: swot.summary || `Marketing maturity score: ${maturityScore}/100.`,
  };

  // Store diagnostic as episode
  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Marketing diagnostic generated for ${discovery.metadata.companyName} — score ${maturityScore}/100`,
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

  const existingObjectives = existingOKRs.map((o) => o.objective).join(", ") || "none";

  const prompt = `You are a senior marketing strategist. Generate 2-3 marketing OKRs based on this diagnostic.

## Context
- Company: ${discovery.metadata.companyName} (${discovery.metadata.sector}, stage: ${discovery.businessContext.stage})
- Primary goal: ${discovery.businessContext.primaryGoal.description} (metric: ${discovery.businessContext.primaryGoal.metric || "undefined"}, timeline: ${discovery.businessContext.primaryGoal.timeline})
- Maturity score: ${diagnostic.maturityScore}/100
- Strengths: ${diagnostic.strengths.join(", ")}
- Weaknesses: ${diagnostic.weaknesses.join(", ")}
- Opportunities: ${diagnostic.opportunities.join(", ")}
- Primary audience: ${discovery.audiences.find((a) => a.priority === "primary")?.segment || "undefined"}
- Budget: ${discovery.currentMarketing.budget.range} (${discovery.currentMarketing.budget.flexibility})
- Team: ${discovery.currentMarketing.team.size} people (dedicated: ${discovery.currentMarketing.team.dedicatedToMarketing})
- Urgency: ${discovery.businessContext.urgency}
- Constraints: ${discovery.businessContext.constraints.map((c) => `${c.type}: ${c.description}`).join("; ")}
- OKRs already proposed: ${existingObjectives}
- Strategic hypotheses (from discovery): ${discovery.strategicHypotheses.join("; ")}

## Rules
- Maximum 3 OKRs, minimum 2
- 1 OKR "primary", the others "secondary"
- Each OKR must have 2-3 measurable Key Results
- Each KR must have a realistic target and timeline
- Link each OKR to a discovery block (problem_value, audience, marketing_landscape, business_context)
- Adapt to the stage: ${discovery.businessContext.stage}

Respond in strict JSON:
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
    description: `${okrArray.length} OKRs proposed for ${discovery.metadata.companyName}`,
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

  const prompt = `You are a senior marketing strategist. Generate concrete actions for this OKR.

## OKR
- Objective: ${okr.objective}
- Key Results: ${okr.keyResults.map((kr) => `${kr.metric} → ${kr.target} (${kr.timeline})`).join("; ")}

## Company context
- ${discovery.metadata.companyName} (${discovery.metadata.sector}, stage: ${discovery.businessContext.stage})
- Team: ${discovery.currentMarketing.team.size} people, skills: ${discovery.currentMarketing.team.skills.join(", ")}, gaps: ${discovery.currentMarketing.team.gaps.join(", ")}
- Budget: ${discovery.currentMarketing.budget.range} (${discovery.currentMarketing.budget.flexibility})
- Current tools: ${discovery.currentMarketing.tools.map((t) => `${t.name} (${t.maturity})`).join(", ")}
- Active channels: ${discovery.currentMarketing.channels.map((c) => `${c.name} (${c.perceivedResults})`).join(", ")}
- Abandoned channels: ${discovery.currentMarketing.abandonedChannels.map((c) => `${c.name}: ${c.reason}`).join("; ") || "none"}
- Constraints: ${discovery.businessContext.constraints.map((c) => `${c.type}: ${c.description} (${c.severity})`).join("; ")}

## Rules
- 3-4 actions per OKR
- At least 1 quick_win (low effort, high impact)
- Each action linked to a specific Key Result
- Actions realistic for the team size and budget
- Do NOT recommend an abandoned channel unless you clearly justify it

Respond in strict JSON:
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
    "suggestedTimeline": "Week 1-2",
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
  const result = saveStrategyUseCase.execute(strategy);

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
        fact: `KR: ${kr.metric} — target ${kr.target} (${kr.timeline})`,
        source: "strategy_agent",
      });
    }
  }

  addClientFactUseCase.execute({
    category: "strategy",
    fact: `Marketing maturity score: ${strategy.diagnostic.maturityScore}/100`,
    source: "strategy_agent",
  });

  return {
    success: true,
    message: `Strategy saved: ${strategy.okrs.length} OKRs, ${strategy.actions.length} actions.`,
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

  const prompt = `You are a marketing strategist. Adjust this OKR according to the client feedback.

## Current OKR
${JSON.stringify(okr, null, 2)}

## Client feedback
${adjustment}

## Context
- Company: ${discovery.metadata.companyName} (${discovery.metadata.sector})
- Stage: ${discovery.businessContext.stage}
- Primary goal: ${discovery.businessContext.primaryGoal.description}

Return the adjusted OKR in strict JSON, same format as the input.`;

  const responseText = await callClaudeHaiku(prompt, 1024);
  return extractJsonFromResponse<OKR>(responseText);
}
