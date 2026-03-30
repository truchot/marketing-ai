// ============================================================
// Strategy Tools Implementation
// Takes BusinessDiscovery as input and produces a 3-layer strategy:
//   Strategic (4 subsystems + OKRs) → Tactical (campaigns) → Operational (tasks)
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
  TargetMarket,
  BusinessStrategy,
  FeedbackLoop,
  MarketingFoundation,
  Campaign,
  ChannelStrategy,
  ContentPlan,
  BudgetAllocation,
  OperationalTask,
  CalendarEntry,
  WeeklyKPI,
  MarketingStrategy,
} from "@/types/marketing-strategy";
import {
  callClaudeHaiku,
  callClaudeSonnet,
  extractJsonFromResponse,
} from "@/tools/discovery/index";

// ============================================================
// Tool 1: generateDiagnostic (STRATÉGIQUE)
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
// Tool 2: analyzeTargetMarket (STRATÉGIQUE — Subsystem 1)
// ============================================================

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

// ============================================================
// Tool 3: defineBusinessStrategy (STRATÉGIQUE — Subsystem 2)
// ============================================================

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

// ============================================================
// Tool 4: defineMarketingFoundation (STRATÉGIQUE — Subsystem 4)
// ============================================================

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

// ============================================================
// Tool 5: defineFeedbackLoop (STRATÉGIQUE — Subsystem 3, Haiku)
// ============================================================

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
      "timeline": "..."
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

// ============================================================
// Tool 6: proposeOKR (STRATÉGIQUE — uses Sonnet)
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

  // Build subsystem context if available
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
// Tool 3: proposeCampaigns (TACTIQUE — uses Sonnet)
// ============================================================

interface ProposeCampaignsInput {
  discovery: BusinessDiscovery;
  okr: OKR;
}

interface ProposeCampaignsOutput {
  campaigns: Campaign[];
  channelStrategy: ChannelStrategy[];
  contentPlan: ContentPlan[];
  budgetAllocation: BudgetAllocation[];
}

export async function proposeCampaigns(
  input: ProposeCampaignsInput
): Promise<ProposeCampaignsOutput> {
  const { discovery, okr } = input;

  const prompt = `Tu es un stratège marketing senior. Génère un plan tactique pour cet OKR : campagnes, stratégie de canaux, plan de contenu et allocation budget.

## OKR
- Objectif : ${okr.objective}
- Rationnel : ${okr.rationale}
- Key Results : ${okr.keyResults.map((kr) => `${kr.metric} → ${kr.target} (${kr.timeline})`).join("; ")}

## Contexte entreprise
- ${discovery.metadata.companyName} (${discovery.metadata.sector}, stade: ${discovery.businessContext.stage})
- Audiences : ${discovery.audiences.map((a) => `${a.segment} (${a.priority}) — canaux: ${a.channels.join(", ")}`).join("; ")}
- Équipe : ${discovery.currentMarketing.team.size} pers., skills: ${discovery.currentMarketing.team.skills.join(", ")}, gaps: ${discovery.currentMarketing.team.gaps.join(", ")}
- Budget : ${discovery.currentMarketing.budget.range} (${discovery.currentMarketing.budget.flexibility})
- Outils actuels : ${discovery.currentMarketing.tools.map((t) => `${t.name} (${t.maturity})`).join(", ")}
- Canaux actifs : ${discovery.currentMarketing.channels.map((c) => `${c.name} (${c.type}, ${c.perceivedResults})`).join(", ")}
- Canaux abandonnés : ${discovery.currentMarketing.abandonedChannels.map((c) => `${c.name}: ${c.reason}`).join("; ") || "aucun"}
- Contraintes : ${discovery.businessContext.constraints.map((c) => `${c.type}: ${c.description} (${c.severity})`).join("; ")}

## Règles
- 1-2 campagnes par OKR, chacune avec un objectif clair et un segment cible
- Choisis les canaux en fonction de là où se trouvent réellement les audiences (pas où on voudrait qu'elles soient)
- Le plan de contenu doit être réaliste pour la taille de l'équipe
- L'allocation budget doit totaliser ~100%
- Ne recommande PAS un canal abandonné sauf si tu justifies clairement

Réponds en JSON strict :
{
  "campaigns": [
    {
      "id": "campaign-1",
      "okrId": "${okr.id}",
      "name": "...",
      "objective": "...",
      "targetSegment": "...",
      "channels": ["..."],
      "contentThemes": ["..."],
      "keyMessages": ["..."],
      "duration": "...",
      "successMetric": "..."
    }
  ],
  "channelStrategy": [
    {
      "channel": "...",
      "role": "acquisition",
      "targetSegments": ["..."],
      "frequency": "...",
      "contentTypes": ["..."],
      "estimatedBudget": "..."
    }
  ],
  "contentPlan": [
    {
      "pillar": "...",
      "themes": ["..."],
      "formats": ["..."],
      "cadence": "...",
      "targetSegment": "..."
    }
  ],
  "budgetAllocation": [
    {
      "channel": "...",
      "monthlyBudget": "...",
      "percentage": 50,
      "justification": "..."
    }
  ]
}`;

  const responseText = await callClaudeSonnet(prompt);
  const result = extractJsonFromResponse<ProposeCampaignsOutput>(responseText);

  // Store as episode
  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Plan tactique proposé pour OKR "${okr.objective}" — ${result.campaigns?.length || 0} campagne(s)`,
    data: { campaigns: result.campaigns, okrId: okr.id },
    tags: ["strategy", "tactical", "campaigns"],
    importance: "high",
  });

  return {
    campaigns: result.campaigns || [],
    channelStrategy: result.channelStrategy || [],
    contentPlan: result.contentPlan || [],
    budgetAllocation: result.budgetAllocation || [],
  };
}

// ============================================================
// Tool 4: proposeTasks (OPÉRATIONNEL — uses Sonnet)
// ============================================================

interface ProposeTasksInput {
  discovery: BusinessDiscovery;
  campaign: Campaign;
}

interface ProposeTasksOutput {
  tasks: OperationalTask[];
  calendar: CalendarEntry[];
  weeklyKPIs: WeeklyKPI[];
}

export async function proposeTasks(
  input: ProposeTasksInput
): Promise<ProposeTasksOutput> {
  const { discovery, campaign } = input;

  const prompt = `Tu es un chef de projet marketing. Génère le plan opérationnel pour cette campagne : tâches concrètes, calendrier éditorial et KPIs hebdo.

## Campagne
- Nom : ${campaign.name}
- Objectif : ${campaign.objective}
- Segment cible : ${campaign.targetSegment}
- Canaux : ${campaign.channels.join(", ")}
- Thèmes de contenu : ${campaign.contentThemes.join(", ")}
- Messages clés : ${campaign.keyMessages.join(", ")}
- Durée : ${campaign.duration}
- Métrique de succès : ${campaign.successMetric}

## Contexte entreprise
- ${discovery.metadata.companyName} (${discovery.metadata.sector})
- Équipe : ${discovery.currentMarketing.team.size} pers., dédiée: ${discovery.currentMarketing.team.dedicatedToMarketing}, skills: ${discovery.currentMarketing.team.skills.join(", ")}
- Outils : ${discovery.currentMarketing.tools.map((t) => `${t.name} (${t.category})`).join(", ")}
- Contraintes : ${discovery.businessContext.constraints.map((c) => `${c.type}: ${c.description} (${c.severity})`).join("; ")}

## Règles
- 3-5 tâches par campagne, chacune avec un owner (rôle), une deadline, et un livrable concret
- Le calendrier éditorial couvre les 4-6 premières semaines
- Les KPIs hebdo doivent être mesurables avec les outils existants
- Les heures estimées doivent être réalistes pour une équipe de ${discovery.currentMarketing.team.size} pers.
- Chaque tâche doit avoir un status initial "todo"

Réponds en JSON strict :
{
  "tasks": [
    {
      "id": "task-1",
      "campaignId": "${campaign.id}",
      "title": "...",
      "description": "...",
      "owner": "...",
      "deadline": "...",
      "priority": "high",
      "status": "todo",
      "estimatedHours": 4,
      "dependencies": [],
      "deliverable": "..."
    }
  ],
  "calendar": [
    {
      "week": "S1",
      "tasks": [
        { "taskId": "task-1", "channel": "...", "contentType": "...", "topic": "..." }
      ]
    }
  ],
  "weeklyKPIs": [
    {
      "metric": "...",
      "targetPerWeek": "...",
      "trackingTool": "..."
    }
  ]
}`;

  const responseText = await callClaudeSonnet(prompt);
  const result = extractJsonFromResponse<ProposeTasksOutput>(responseText);

  // Store as episode
  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Plan opérationnel proposé pour campagne "${campaign.name}" — ${result.tasks?.length || 0} tâche(s)`,
    data: { tasks: result.tasks, campaignId: campaign.id },
    tags: ["strategy", "operational", "tasks"],
    importance: "high",
  });

  return {
    tasks: result.tasks || [],
    calendar: result.calendar || [],
    weeklyKPIs: result.weeklyKPIs || [],
  };
}

// ============================================================
// Tool 5: saveStrategy — delegates to SaveStrategyUseCase
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

  // Store subsystem facts in semantic memory
  addClientFactUseCase.execute({
    category: "strategy",
    fact: `Marché cible: ${strategy.strategic.targetMarket.marketDefinition}`,
    source: "strategy_agent",
  });

  addClientFactUseCase.execute({
    category: "strategy",
    fact: `Proposition de valeur: ${strategy.strategic.businessStrategy.valueProposition}`,
    source: "strategy_agent",
  });

  addClientFactUseCase.execute({
    category: "strategy",
    fact: `Message principal: ${strategy.strategic.marketingFoundation.messaging.primaryMessage}`,
    source: "strategy_agent",
  });

  // Store key strategic facts in semantic memory for cross-phase retrieval
  for (const okr of strategy.strategic.okrs) {
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

  // Store tactical facts
  for (const campaign of strategy.tactical.campaigns) {
    addClientFactUseCase.execute({
      category: "strategy",
      fact: `Campagne "${campaign.name}" — segment: ${campaign.targetSegment}, canaux: ${campaign.channels.join(", ")}`,
      source: "strategy_agent",
    });
  }

  addClientFactUseCase.execute({
    category: "strategy",
    fact: `Score maturité marketing: ${strategy.strategic.diagnostic.maturityScore}/100`,
    source: "strategy_agent",
  });

  const taskCount = strategy.operational.tasks.length;
  const campaignCount = strategy.tactical.campaigns.length;

  return {
    success: true,
    message: `Stratégie sauvegardée : ${strategy.strategic.okrs.length} OKR, ${campaignCount} campagne(s), ${taskCount} tâche(s) opérationnelle(s).`,
    strategyId,
  };
}

// ============================================================
// Tool 6: adjustOKR (uses Haiku — lightweight adjustment task)
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
