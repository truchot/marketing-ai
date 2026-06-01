// ============================================================
// Tools 8-9: Tactical Subsystems
//   8. proposeMarketingPlan (Subsystem 5)
//   9. proposeMarketingSystem (Subsystem 6)
// ============================================================

import { recordEpisodeUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type {
  OKR,
  TargetMarket,
  BusinessStrategy,
  MarketingFoundation,
  MarketingPlan,
  MarketingSystem,
} from "@/types/marketing-strategy";
import { callClaudeSonnet, extractJsonFromResponse } from "@/tools/discovery/index";

// ============================================================
// Tool 8: proposeMarketingPlan (uses Sonnet)
// ============================================================

interface ProposeMarketingPlanInput {
  discovery: BusinessDiscovery;
  okrs: OKR[];
  targetMarket: TargetMarket;
  businessStrategy: BusinessStrategy;
  marketingFoundation: MarketingFoundation;
}

export async function proposeMarketingPlan(
  input: ProposeMarketingPlanInput
): Promise<MarketingPlan> {
  const { discovery, okrs, targetMarket, businessStrategy, marketingFoundation } = input;

  const okrSummary = okrs.map((o) =>
    `- [${o.id}] ${o.objective} (${o.priority}) — KRs: ${o.keyResults.map((kr) => `${kr.metric} → ${kr.target}`).join("; ")}`
  ).join("\n");

  const prompt = `Tu es un stratège marketing senior. Génère le Marketing Plan complet : campagnes pour tous les OKRs, stratégie de canaux, plan de contenu, allocation budget, KPIs tactiques et roadmap.

## OKRs validés
${okrSummary}

## Sous-systèmes stratégiques
- Marché cible : ${targetMarket.marketDefinition}
- Segments : ${targetMarket.segments.map((s) => `${s.segment} (${s.priority}): "${s.mainPain}"`).join("; ")}
- ICP : ${targetMarket.icp.description}
- Proposition de valeur : ${businessStrategy.valueProposition}
- Différenciateur : ${businessStrategy.uniqueDifferentiator}
- Angle concurrentiel : ${businessStrategy.competitiveAngle}
- Message principal : ${marketingFoundation.messaging.primaryMessage}
- Positionnement : ${marketingFoundation.positioning.uniqueValue}

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
- Chaque campagne doit cibler une étape du funnel (awareness, consideration, conversion, retention)
- Chaque canal doit spécifier les étapes du funnel qu'il couvre
- Choisis les canaux en fonction de là où se trouvent réellement les audiences
- Le plan de contenu doit être réaliste pour la taille de l'équipe
- L'allocation budget doit totaliser ~100% sur l'ensemble des campagnes (pas par OKR)
- Ne recommande PAS un canal abandonné sauf si tu justifies clairement
- Chaque KPI tactique doit être lié à une campagne
- Le roadmap doit avoir 2-3 phases avec des jalons clairs
- Définis un cycle de revue tactique (4-16 semaines) pour ajuster en fonction des performances

Réponds en JSON strict :
{
  "campaigns": [
    { "id": "campaign-1", "okrId": "okr-1", "name": "...", "objective": "...", "targetSegment": "...", "funnelStage": "awareness", "channels": ["..."], "contentThemes": ["..."], "keyMessages": ["..."], "duration": "...", "successMetric": "..." }
  ],
  "channelStrategy": [
    { "channel": "...", "role": "acquisition", "funnelStages": ["awareness", "consideration"], "targetSegments": ["..."], "frequency": "...", "contentTypes": ["..."], "estimatedBudget": "..." }
  ],
  "contentPlan": [
    { "pillar": "...", "themes": ["..."], "formats": ["..."], "cadence": "...", "targetSegment": "..." }
  ],
  "budgetAllocation": [
    { "channel": "...", "monthlyBudget": "...", "percentage": 50, "justification": "..." }
  ],
  "kpis": [
    { "id": "kpi-1", "campaignId": "campaign-1", "metric": "...", "baseline": null, "target": "...", "trackingMethod": "..." }
  ],
  "roadmap": [
    { "phase": "Phase 1 - ...", "startWeek": "S1", "endWeek": "S6", "focus": "...", "campaigns": ["campaign-1"], "milestones": ["..."] }
  ],
  "reviewCycle": "6 semaines"
}`;

  const responseText = await callClaudeSonnet(prompt);
  const result = extractJsonFromResponse<MarketingPlan>(responseText);

  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Marketing Plan proposé pour ${discovery.metadata.companyName} — ${result.campaigns?.length || 0} campagne(s), ${result.roadmap?.length || 0} phase(s)`,
    data: { marketingPlan: result },
    tags: ["strategy", "tactical", "marketing-plan"],
    importance: "high",
  });

  return {
    campaigns: result.campaigns || [],
    channelStrategy: result.channelStrategy || [],
    contentPlan: result.contentPlan || [],
    budgetAllocation: result.budgetAllocation || [],
    kpis: result.kpis || [],
    roadmap: result.roadmap || [],
    reviewCycle: result.reviewCycle || "6 semaines",
  };
}

// ============================================================
// Tool 9: proposeMarketingSystem (uses Sonnet)
// ============================================================

interface ProposeMarketingSystemInput {
  discovery: BusinessDiscovery;
  marketingPlan: MarketingPlan;
  businessStrategy: BusinessStrategy;
}

export async function proposeMarketingSystem(
  input: ProposeMarketingSystemInput
): Promise<MarketingSystem> {
  const { discovery, marketingPlan, businessStrategy } = input;

  const campaignSummary = marketingPlan.campaigns
    .map((c) => `- [${c.id}] ${c.name} — canaux: ${c.channels.join(", ")}`)
    .join("\n");

  const channelSummary = marketingPlan.channelStrategy
    .map((ch) => `- ${ch.channel} (${ch.role}) — fréquence: ${ch.frequency}`)
    .join("\n");

  const prompt = `Tu es un consultant marketing ops. Conçois le Marketing System : backlog d'items à configurer, processus récurrents, automations et architecture système.

## Marketing Plan validé
### Campagnes
${campaignSummary}

### Canaux
${channelSummary}

## Contexte
- Entreprise : ${discovery.metadata.companyName} (stade: ${businessStrategy.businessStage})
- Équipe : ${discovery.currentMarketing.team.size} pers., dédiée: ${discovery.currentMarketing.team.dedicatedToMarketing}
  Skills: ${discovery.currentMarketing.team.skills.join(", ")}
  Gaps: ${discovery.currentMarketing.team.gaps.join(", ")}
- Outils actuels : ${discovery.currentMarketing.tools.map((t) => `${t.name} (${t.category}, ${t.maturity})`).join("; ")}
- Contraintes : ${discovery.businessContext.constraints.map((c) => `${c.type}: ${c.description} (${c.severity})`).join("; ")}

## Règles
- Le backlog doit inclure les items nécessaires pour exécuter les campagnes (config outils, templates, intégrations)
- Les processus doivent couvrir la production de contenu, le nurturing et le reporting au minimum
- Les automations doivent être réalistes avec les outils disponibles
- L'architecture système doit montrer les flux de données entre outils
- Chaque item du backlog doit être lié aux campagnes qui en dépendent
- Adapte la complexité au stade de l'entreprise (${businessStrategy.businessStage})

Réponds en JSON strict :
{
  "backlog": [
    { "id": "backlog-1", "title": "...", "type": "tool_setup", "description": "...", "priority": "high", "status": "todo", "estimatedEffort": "2h", "linkedCampaignIds": ["campaign-1"] }
  ],
  "processes": [
    { "id": "process-1", "name": "...", "description": "...", "steps": ["..."], "frequency": "hebdomadaire", "owner": "...", "tools": ["..."] }
  ],
  "automations": [
    { "id": "auto-1", "name": "...", "trigger": "...", "action": "...", "tool": "...", "linkedProcessId": "process-1" }
  ],
  "systemArchitecture": {
    "tools": [
      { "name": "...", "role": "...", "category": "...", "integrations": ["..."], "configurationNeeded": "..." }
    ],
    "dataFlows": [
      { "from": "...", "to": "...", "data": "..." }
    ]
  }
}`;

  const responseText = await callClaudeSonnet(prompt);
  const result = extractJsonFromResponse<MarketingSystem>(responseText);

  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Marketing System proposé — ${result.backlog?.length || 0} backlog item(s), ${result.processes?.length || 0} processus, ${result.automations?.length || 0} automation(s)`,
    data: { marketingSystem: result },
    tags: ["strategy", "tactical", "marketing-system"],
    importance: "high",
  });

  return {
    backlog: result.backlog || [],
    processes: result.processes || [],
    automations: result.automations || [],
    systemArchitecture: result.systemArchitecture || { tools: [], dataFlows: [] },
  };
}
