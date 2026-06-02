import type { MarketingStrategy } from "@/types/marketing-strategy";

export function makeOKR(id: string, priority: "primary" | "secondary" = "secondary") {
  return {
    id,
    objective: `Objective ${id}`,
    rationale: "Test rationale",
    keyResults: [
      {
        id: `kr-${id}-1`,
        metric: "Test metric",
        current: null,
        target: "100",
        timeline: "Q1 2026",
        confidence: "medium" as const,
      },
    ],
    priority,
    linkedDiscoveryData: {
      fromBlock: "business_context" as const,
      evidence: "Test evidence",
    },
  };
}

export function makeCampaign(id: string, okrId: string) {
  return {
    id,
    okrId,
    name: `Campaign ${id}`,
    objective: "Test campaign objective",
    targetSegment: "PME SaaS",
    funnelStage: "awareness" as const,
    channels: ["LinkedIn", "Blog"],
    contentThemes: ["expertise technique"],
    keyMessages: ["Message clé"],
    duration: "6 semaines",
    successMetric: "Leads générés",
  };
}

export function makeTask(id: string, campaignId: string) {
  return {
    id,
    campaignId,
    title: `Task ${id}`,
    description: "Test task description",
    owner: "Marketing Manager",
    deadline: "S2",
    priority: "high" as const,
    status: "todo" as const,
    estimatedHours: 4,
    dependencies: [],
    deliverable: "Document livré",
  };
}

export function makeStrategy(
  overrides: Partial<MarketingStrategy> = {}
): MarketingStrategy {
  const okr1 = makeOKR("okr-1", "primary");
  const okr2 = makeOKR("okr-2", "secondary");
  return {
    metadata: {
      companyName: "TestCo",
      generatedAt: "2026-01-01T00:00:00.000Z",
      discoveryCompletionStatus: "complete",
      strategyVersion: 1,
    },
    strategic: {
      diagnostic: {
        maturityScore: 55,
        problems: [
          {
            key: "painless_problem",
            label: "The problem solved is not painful enough",
            severity: "problematic",
            isStrategic: true,
            evidence: 'Pain level reported as "bloquant".',
            recommendation: "Re-anchor on a more acute, urgent pain.",
            confidence: "high",
            dataSufficiency: "measured",
          },
        ],
        criticalProblems: [],
        strengths: ["Good SEO"],
        weaknesses: ["No paid ads"],
        opportunities: ["Content marketing"],
        threats: ["Strong competition"],
        summary: "Test summary",
      },
      targetMarket: {
        marketDefinition: "PME SaaS B2B en France",
        segments: [
          {
            segment: "PME SaaS",
            priority: "primary",
            mainPain: "Manque de visibilité",
            targetMessage: "Développez votre visibilité en 30 jours",
          },
        ],
        icp: {
          description: "Fondateur de PME SaaS B2B, 10-50 employés",
          painPoints: ["Manque de visibilité", "Pas de stratégie marketing"],
          triggerMoments: ["Levée de fonds", "Stagnation croissance"],
          buyingContext: "Recherche d'expertise externe",
          preferredChannels: ["LinkedIn", "Blog"],
          commonObjections: ["Trop cher", "Pas le temps"],
          decisionCriteria: ["ROI prouvé", "Expertise sectorielle"],
        },
      },
      businessStrategy: {
        vision: "Devenir la référence marketing IA pour les PME SaaS",
        valueProposition: "Automatisation marketing accessible pour PME SaaS",
        transformation: {
          before: "Marketing ad-hoc sans stratégie",
          after: "Stratégie marketing structurée et mesurable",
          timeToValue: "30 jours",
        },
        uniqueDifferentiator: "IA + expertise marketing combinées",
        competitiveAngle: "Prix + simplicité",
        businessStage: "growth",
        revenueTargets: {
          targetCac: "< 150€",
          targetLtvCacRatio: "> 3x",
          targetCacPayback: "< 12 mois",
          targetPipeline: "500K€/trimestre",
          revenueModel: "Le marketing génère des MQL convertis par l'équipe commerciale",
        },
      },
      feedbackLoop: {
        hypotheses: ["Le contenu LinkedIn génère des leads qualifiés"],
        validationTests: [
          {
            hypothesis: "Le contenu LinkedIn génère des leads qualifiés",
            metric: "Leads LinkedIn / mois",
            method: "Analytics LinkedIn + CRM",
            successCriteria: ">10 leads/mois",
            timeline: "3 mois",
            status: "untested",
            linkedKpiIds: [],
          },
        ],
        reviewCadence: "bi-mensuel",
        pivotTriggers: ["<5 leads/mois après 3 mois"],
      },
      marketingFoundation: {
        offer: "Audit marketing + stratégie personnalisée",
        positioning: {
          targetMarket: "PME SaaS B2B",
          uniqueValue: "Automatisation marketing accessible",
          competitiveAngle: "Prix + simplicité",
          brandPersonality: "Expert accessible",
        },
        messaging: {
          primaryMessage: "Structurez votre marketing en 30 jours",
          segmentMessages: [
            { segment: "PME SaaS", message: "Développez votre visibilité", tone: "professionnel" },
          ],
          proofPoints: ["50+ clients accompagnés"],
        },
      },
      okrs: [okr1, okr2],
      timeHorizon: "12 mois",
      roadmapValidation: {
        strategySummary: {
          whoWeHelp: "PME SaaS B2B en France",
          whatProblem: "Manque de visibilité et stratégie marketing",
          howWeDiffer: "IA + expertise marketing combinées",
          whatWeSay: "Structurez votre marketing en 30 jours",
        },
        readinessScore: 85,
        gaps: [],
        recommendation: "proceed",
      },
    },
    tactical: {
      marketingPlan: {
        campaigns: [
          makeCampaign("campaign-1", "okr-1"),
          makeCampaign("campaign-2", "okr-2"),
        ],
        channelStrategy: [
          {
            channel: "LinkedIn",
            role: "acquisition",
            funnelStages: ["awareness", "consideration"],
            targetSegments: ["PME SaaS"],
            frequency: "3 posts/semaine",
            contentTypes: ["article", "post"],
            estimatedBudget: "500€/mois",
          },
        ],
        contentPlan: [
          {
            pillar: "Expertise technique",
            themes: ["SEO", "Content marketing"],
            formats: ["article", "infographie"],
            cadence: "2/semaine",
            targetSegment: "PME SaaS",
          },
        ],
        budgetAllocation: [
          {
            channel: "LinkedIn",
            monthlyBudget: "500€",
            percentage: 100,
            justification: "Canal principal d'acquisition B2B",
            expectedCac: "120€",
            expectedRoas: "3.5x",
          },
        ],
        kpis: [
          {
            id: "kpi-1",
            campaignId: "campaign-1",
            metric: "Leads générés",
            baseline: null,
            target: "50/mois",
            trackingMethod: "CRM",
          },
        ],
        roadmap: [
          {
            phase: "Phase 1 - Fondations",
            startWeek: "S1",
            endWeek: "S6",
            focus: "Mise en place des canaux",
            campaigns: ["campaign-1"],
            milestones: ["Premiers contenus publiés"],
          },
        ],
        reviewCycle: "6 semaines",
      },
      marketingSystem: {
        backlog: [
          {
            id: "backlog-1",
            title: "Configurer LinkedIn Ads",
            type: "tool_setup",
            description: "Setup du compte publicitaire",
            priority: "high",
            status: "todo",
            estimatedEffort: "2h",
            linkedCampaignIds: ["campaign-1"],
          },
        ],
        processes: [
          {
            id: "process-1",
            name: "Production de contenu",
            description: "Workflow de création de contenu",
            steps: ["Brief", "Rédaction", "Review", "Publication"],
            frequency: "hebdomadaire",
            owner: "Content Manager",
            tools: ["Notion", "LinkedIn"],
          },
        ],
        automations: [
          {
            id: "auto-1",
            name: "Publication automatique",
            trigger: "Contenu validé dans Notion",
            action: "Publication programmée sur LinkedIn",
            tool: "Buffer",
            linkedProcessId: "process-1",
          },
        ],
        systemArchitecture: {
          tools: [
            {
              name: "LinkedIn",
              role: "Canal d'acquisition principal",
              category: "social",
              integrations: ["Buffer"],
              configurationNeeded: "Compte publicitaire",
            },
          ],
          dataFlows: [
            { from: "LinkedIn", to: "CRM", data: "Leads générés" },
          ],
        },
      },
    },
    operational: {
      tasks: [
        makeTask("task-1", "campaign-1"),
        makeTask("task-2", "campaign-2"),
      ],
      calendar: [
        {
          week: "S1",
          tasks: [
            { taskId: "task-1", channel: "LinkedIn", contentType: "article", topic: "SEO basics" },
          ],
        },
      ],
      weeklyKPIs: [
        { metric: "Impressions LinkedIn", targetPerWeek: "5000", trackingTool: "LinkedIn Analytics" },
      ],
    },
    constraints: {
      budgetFit: true,
      teamFit: true,
      adaptations: [],
    },
    narrativeSummary: "Test narrative summary for strategy.",
    ...overrides,
  };
}
