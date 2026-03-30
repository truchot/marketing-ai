import { describe, it, expect } from "vitest";
import { SaveStrategyUseCase } from "@/domains/strategy/use-cases/save-strategy";
import { FakeStrategyRepository } from "../fakes/fake-strategy-repository";
import type { MarketingStrategy } from "@/types/marketing-strategy";

function makeStrategy(
  overrides: Partial<MarketingStrategy> = {}
): MarketingStrategy {
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
          description: "Fondateur de PME SaaS B2B",
          painPoints: ["Manque de visibilité"],
          triggerMoments: ["Levée de fonds"],
          buyingContext: "Recherche d'expertise externe",
          preferredChannels: ["LinkedIn"],
          commonObjections: ["Trop cher"],
          decisionCriteria: ["ROI prouvé"],
        },
      },
      businessStrategy: {
        vision: "Devenir la référence marketing IA",
        valueProposition: "Automatisation marketing accessible",
        transformation: {
          before: "Marketing ad-hoc",
          after: "Stratégie structurée",
          timeToValue: "30 jours",
        },
        uniqueDifferentiator: "IA + expertise",
        competitiveAngle: "Prix + simplicité",
        businessStage: "growth",
      },
      feedbackLoop: {
        hypotheses: ["Le contenu LinkedIn génère des leads"],
        validationTests: [
          {
            hypothesis: "Le contenu LinkedIn génère des leads",
            metric: "Leads/mois",
            method: "Analytics",
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
        offer: "Audit marketing + stratégie",
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
      timeHorizon: "12 mois",
      roadmapValidation: {
        strategySummary: {
          whoWeHelp: "PME SaaS B2B en France",
          whatProblem: "Manque de visibilité",
          howWeDiffer: "IA + expertise",
          whatWeSay: "Structurez votre marketing en 30 jours",
        },
        readinessScore: 80,
        gaps: [],
        recommendation: "proceed",
      },
      okrs: [
        {
          id: "okr-1",
          objective: "Increase visibility",
          rationale: "Low brand awareness",
          keyResults: [
            {
              id: "kr-1-1",
              metric: "Monthly organic traffic",
              current: "1000",
              target: "5000",
              timeline: "Q2 2026",
              confidence: "medium",
            },
          ],
          priority: "primary",
          linkedDiscoveryData: {
            fromBlock: "business_context",
            evidence: "Client mentioned low visibility",
          },
        },
      ],
    },
    tactical: {
      marketingPlan: {
        campaigns: [
          {
            id: "campaign-1",
            okrId: "okr-1",
            name: "Campagne SEO",
            objective: "Augmenter le trafic organique",
            targetSegment: "PME SaaS",
            funnelStage: "awareness",
            channels: ["Blog", "LinkedIn"],
            contentThemes: ["SEO technique"],
            keyMessages: ["Visibilité organique"],
            duration: "3 mois",
            successMetric: "Trafic organique mensuel",
          },
        ],
        channelStrategy: [
          {
            channel: "Blog",
            role: "acquisition",
            funnelStages: ["awareness"],
            targetSegments: ["PME SaaS"],
            frequency: "2 articles/semaine",
            contentTypes: ["article"],
            estimatedBudget: "0€",
          },
        ],
        contentPlan: [
          {
            pillar: "SEO technique",
            themes: ["Optimisation on-page", "Link building"],
            formats: ["article"],
            cadence: "2/semaine",
            targetSegment: "PME SaaS",
          },
        ],
        budgetAllocation: [
          {
            channel: "Blog",
            monthlyBudget: "0€",
            percentage: 100,
            justification: "Contenu organique, pas de coût média",
          },
        ],
        kpis: [
          {
            id: "kpi-1",
            campaignId: "campaign-1",
            metric: "Trafic organique",
            baseline: "1000",
            target: "5000",
            trackingMethod: "Google Analytics",
          },
        ],
        roadmap: [
          {
            phase: "Phase 1 - SEO",
            startWeek: "S1",
            endWeek: "S12",
            focus: "Fondations SEO",
            campaigns: ["campaign-1"],
            milestones: ["Audit SEO terminé"],
          },
        ],
        reviewCycle: "4 semaines",
      },
      marketingSystem: {
        backlog: [
          {
            id: "backlog-1",
            title: "Setup Google Search Console",
            type: "tool_setup",
            description: "Configurer GSC",
            priority: "high",
            status: "todo",
            estimatedEffort: "1h",
            linkedCampaignIds: ["campaign-1"],
          },
        ],
        processes: [
          {
            id: "process-1",
            name: "Production articles SEO",
            description: "Workflow de création d'articles",
            steps: ["Keyword research", "Rédaction", "Optimisation", "Publication"],
            frequency: "2/semaine",
            owner: "Content Manager",
            tools: ["Notion", "WordPress"],
          },
        ],
        automations: [
          {
            id: "auto-1",
            name: "Notification nouveau lead",
            trigger: "Formulaire soumis",
            action: "Notification Slack",
            tool: "Zapier",
            linkedProcessId: "process-1",
          },
        ],
        systemArchitecture: {
          tools: [
            {
              name: "Google Analytics",
              role: "Tracking et analytics",
              category: "analytics",
              integrations: ["Google Search Console"],
              configurationNeeded: "Goals et events",
            },
          ],
          dataFlows: [
            { from: "Blog", to: "Google Analytics", data: "Page views et conversions" },
          ],
        },
      },
    },
    operational: {
      tasks: [
        {
          id: "task-1",
          campaignId: "campaign-1",
          title: "SEO audit",
          description: "Perform a full SEO audit",
          owner: "SEO Manager",
          deadline: "S1",
          priority: "high",
          status: "todo",
          estimatedHours: 8,
          dependencies: [],
          deliverable: "Rapport d'audit SEO",
        },
      ],
      calendar: [
        {
          week: "S1",
          tasks: [
            { taskId: "task-1", channel: "Blog", contentType: "audit", topic: "SEO audit complet" },
          ],
        },
      ],
      weeklyKPIs: [
        { metric: "Pages indexées", targetPerWeek: "5", trackingTool: "Google Search Console" },
      ],
    },
    constraints: {
      budgetFit: true,
      teamFit: true,
      adaptations: [],
    },
    narrativeSummary: "Test narrative.",
    ...overrides,
  };
}

describe("SaveStrategyUseCase", () => {
  function setup() {
    const repo = new FakeStrategyRepository();
    const useCase = new SaveStrategyUseCase(repo);
    return { repo, useCase };
  }

  it("should save a valid strategy and return an id", () => {
    const { repo, useCase } = setup();
    const strategy = makeStrategy();

    const result = useCase.execute(strategy);

    expect(result.isOk()).toBe(true);
    expect(result.value).toMatch(/^strategy-test-/);
    expect(repo.getLatest()).not.toBeNull();
    expect(repo.getLatest()!.metadata.companyName).toBe("TestCo");
  });

  it("should preserve metadata through save round-trip", () => {
    const { repo, useCase } = setup();
    const strategy = makeStrategy({
      metadata: {
        companyName: "AcmeCorp",
        generatedAt: "2026-03-12T10:00:00.000Z",
        discoveryCompletionStatus: "partial",
        strategyVersion: 2,
      },
    });

    useCase.execute(strategy);
    const saved = repo.getLatest()!;

    expect(saved.metadata.discoveryCompletionStatus).toBe("partial");
    expect(saved.metadata.strategyVersion).toBe(2);
  });

  it("should reject strategy with zero OKRs", () => {
    const { useCase } = setup();
    const strategy = makeStrategy();
    strategy.strategic.okrs = [];

    const result = useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at least one OKR");
  });

  it("should reject strategy with more than 3 OKRs", () => {
    const { useCase } = setup();
    const okr = {
      id: "okr-x",
      objective: "X",
      rationale: "X",
      keyResults: [
        { id: "kr-x", metric: "X", current: null, target: "X", timeline: "X", confidence: "low" as const },
      ],
      priority: "secondary" as const,
      linkedDiscoveryData: { fromBlock: "business_context" as const, evidence: "X" },
    };
    const strategy = makeStrategy();
    strategy.strategic.okrs = [
      { ...okr, id: "okr-1", priority: "primary" },
      { ...okr, id: "okr-2" },
      { ...okr, id: "okr-3" },
      { ...okr, id: "okr-4" },
    ];

    const result = useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at most 3 OKRs");
  });

  it("should reject strategy with zero campaigns", () => {
    const { useCase } = setup();
    const strategy = makeStrategy();
    strategy.tactical.marketingPlan.campaigns = [];

    const result = useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at least one campaign");
  });

  it("should reject strategy with zero operational tasks", () => {
    const { useCase } = setup();
    const strategy = makeStrategy();
    strategy.operational.tasks = [];

    const result = useCase.execute(strategy);

    expect(result.isErr()).toBe(true);
    expect(result.error.message).toContain("at least one operational task");
  });

  it("should save multiple strategies and retrieve latest", () => {
    const { repo, useCase } = setup();

    useCase.execute(makeStrategy({ metadata: { companyName: "First", generatedAt: "2026-01-01T00:00:00.000Z", discoveryCompletionStatus: "complete", strategyVersion: 1 } }));
    useCase.execute(makeStrategy({ metadata: { companyName: "Second", generatedAt: "2026-02-01T00:00:00.000Z", discoveryCompletionStatus: "complete", strategyVersion: 1 } }));

    expect(repo.getLatest()!.metadata.companyName).toBe("Second");
  });
});
