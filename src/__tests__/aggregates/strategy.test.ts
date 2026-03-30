import { describe, it, expect } from "vitest";
import { StrategyAggregate } from "@/domains/strategy/aggregates";
import type { MarketingStrategy } from "@/types/marketing-strategy";

function makeOKR(id: string, priority: "primary" | "secondary" = "secondary") {
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

function makeCampaign(id: string, okrId: string) {
  return {
    id,
    okrId,
    name: `Campaign ${id}`,
    objective: "Test campaign objective",
    targetSegment: "PME SaaS",
    channels: ["LinkedIn", "Blog"],
    contentThemes: ["expertise technique"],
    keyMessages: ["Message clé"],
    duration: "6 semaines",
    successMetric: "Leads générés",
  };
}

function makeTask(id: string, campaignId: string) {
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

function makeStrategy(
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

describe("StrategyAggregate", () => {
  describe("create", () => {
    it("should create a valid strategy with all 3 layers", () => {
      const strategy = makeStrategy();
      const aggregate = StrategyAggregate.create(strategy);

      expect(aggregate.id).toMatch(/^strategy-/);
      expect(aggregate.companyName).toBe("TestCo");
      expect(aggregate.diagnostic.maturityScore).toBe(55);
      expect(aggregate.targetMarket.segments).toHaveLength(1);
      expect(aggregate.businessStrategy.valueProposition).toBe("Automatisation marketing accessible pour PME SaaS");
      expect(aggregate.feedbackLoop.hypotheses).toHaveLength(1);
      expect(aggregate.marketingFoundation.messaging.primaryMessage).toBe("Structurez votre marketing en 30 jours");
      expect(aggregate.okrs).toHaveLength(2);
      expect(aggregate.marketingPlan.campaigns).toHaveLength(2);
      expect(aggregate.marketingPlan.roadmap).toHaveLength(1);
      expect(aggregate.marketingSystem.processes).toHaveLength(1);
      expect(aggregate.operational.tasks).toHaveLength(2);
      expect(aggregate.narrativeSummary).toBe("Test narrative summary for strategy.");
    });

    it("should preserve original metadata", () => {
      const strategy = makeStrategy({
        metadata: {
          companyName: "AcmeCorp",
          generatedAt: "2026-03-12T10:00:00.000Z",
          discoveryCompletionStatus: "partial",
          strategyVersion: 3,
        },
      });
      const aggregate = StrategyAggregate.create(strategy);
      const output = aggregate.toStrategy();

      expect(output.metadata.companyName).toBe("AcmeCorp");
      expect(output.metadata.discoveryCompletionStatus).toBe("partial");
      expect(output.metadata.strategyVersion).toBe(3);
      expect(output.metadata.generatedAt).toBe("2026-03-12T10:00:00.000Z");
    });

    it("should raise STRATEGY_GENERATED domain event on creation", () => {
      const strategy = makeStrategy();
      const aggregate = StrategyAggregate.create(strategy);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("STRATEGY_GENERATED");
      expect(events[0].payload).toMatchObject({
        strategyId: aggregate.id,
        companyName: "TestCo",
        okrCount: 2,
        segmentCount: 1,
        hypothesisCount: 1,
        campaignCount: 2,
        processCount: 1,
        taskCount: 2,
        maturityScore: 55,
      });
    });

    it("should reject strategy with zero OKRs", () => {
      const strategy = makeStrategy();
      strategy.strategic.okrs = [];

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "A strategy must have at least one OKR"
      );
    });

    it("should reject strategy with more than 3 OKRs", () => {
      const strategy = makeStrategy();
      strategy.strategic.okrs = [
        makeOKR("okr-1", "primary"),
        makeOKR("okr-2"),
        makeOKR("okr-3"),
        makeOKR("okr-4"),
      ];

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "A strategy must have at most 3 OKRs"
      );
    });

    it("should accept strategy with exactly 3 OKRs", () => {
      const strategy = makeStrategy();
      strategy.strategic.okrs = [
        makeOKR("okr-1", "primary"),
        makeOKR("okr-2"),
        makeOKR("okr-3"),
      ];

      const aggregate = StrategyAggregate.create(strategy);
      expect(aggregate.okrs).toHaveLength(3);
    });

    it("should accept strategy with exactly 1 OKR", () => {
      const strategy = makeStrategy();
      strategy.strategic.okrs = [makeOKR("okr-1", "primary")];

      const aggregate = StrategyAggregate.create(strategy);
      expect(aggregate.okrs).toHaveLength(1);
    });

    it("should reject strategy with zero target market segments", () => {
      const strategy = makeStrategy();
      strategy.strategic.targetMarket.segments = [];

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "Target market must have at least one segment"
      );
    });

    it("should reject strategy with zero ICP pain points", () => {
      const strategy = makeStrategy();
      strategy.strategic.targetMarket.icp.painPoints = [];

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "ICP must have at least one pain point"
      );
    });

    it("should reject strategy with empty value proposition", () => {
      const strategy = makeStrategy();
      strategy.strategic.businessStrategy.valueProposition = "  ";

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "Business strategy must have a value proposition"
      );
    });

    it("should reject strategy with empty primary message", () => {
      const strategy = makeStrategy();
      strategy.strategic.marketingFoundation.messaging.primaryMessage = "";

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "Marketing foundation must have a primary message"
      );
    });

    it("should reject strategy with zero feedback loop hypotheses", () => {
      const strategy = makeStrategy();
      strategy.strategic.feedbackLoop.hypotheses = [];

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "Feedback loop must have at least one hypothesis"
      );
    });

    it("should reject strategy with zero campaigns", () => {
      const strategy = makeStrategy();
      strategy.tactical.marketingPlan.campaigns = [];

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "Marketing plan must have at least one campaign"
      );
    });

    it("should reject strategy with zero roadmap phases", () => {
      const strategy = makeStrategy();
      strategy.tactical.marketingPlan.roadmap = [];

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "Marketing plan must have at least one roadmap phase"
      );
    });

    it("should reject strategy with zero marketing system processes", () => {
      const strategy = makeStrategy();
      strategy.tactical.marketingSystem.processes = [];

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "Marketing system must have at least one process"
      );
    });

    it("should reject strategy with zero operational tasks", () => {
      const strategy = makeStrategy();
      strategy.operational.tasks = [];

      expect(() => StrategyAggregate.create(strategy)).toThrow(
        "A strategy must have at least one operational task"
      );
    });
  });

  describe("updateOKR", () => {
    it("should update an existing OKR", () => {
      const strategy = makeStrategy();
      const aggregate = StrategyAggregate.create(strategy);

      aggregate.updateOKR("okr-1", { objective: "New objective" });

      expect(aggregate.okrs[0].objective).toBe("New objective");
      // Other fields preserved
      expect(aggregate.okrs[0].id).toBe("okr-1");
      expect(aggregate.okrs[0].priority).toBe("primary");
    });

    it("should throw when OKR not found", () => {
      const strategy = makeStrategy();
      const aggregate = StrategyAggregate.create(strategy);

      expect(() =>
        aggregate.updateOKR("nonexistent", { objective: "x" })
      ).toThrow("OKR nonexistent not found");
    });
  });

  describe("removeOKR", () => {
    it("should remove OKR and its associated campaigns and tasks", () => {
      const strategy = makeStrategy();
      const aggregate = StrategyAggregate.create(strategy);

      aggregate.removeOKR("okr-1");

      expect(aggregate.okrs).toHaveLength(1);
      expect(aggregate.okrs[0].id).toBe("okr-2");
      // Campaigns for okr-1 should be removed
      expect(aggregate.marketingPlan.campaigns.every((c) => c.okrId !== "okr-1")).toBe(true);
      // Tasks linked to campaign-1 (which was linked to okr-1) should be removed
      expect(aggregate.operational.tasks.every((t) => t.campaignId !== "campaign-1")).toBe(true);
    });

    it("should throw when removing the last OKR", () => {
      const strategy = makeStrategy();
      strategy.strategic.okrs = [makeOKR("okr-1", "primary")];

      const aggregate = StrategyAggregate.create(strategy);

      expect(() => aggregate.removeOKR("okr-1")).toThrow(
        "Cannot remove last OKR"
      );
    });

    it("should leave OKRs unchanged when removing nonexistent OKR", () => {
      const strategy = makeStrategy();
      const aggregate = StrategyAggregate.create(strategy);

      aggregate.removeOKR("nonexistent");
      expect(aggregate.okrs).toHaveLength(2);
    });
  });

  describe("toStrategy", () => {
    it("should produce a complete MarketingStrategy object with 3 layers", () => {
      const input = makeStrategy();
      const aggregate = StrategyAggregate.create(input);
      const output = aggregate.toStrategy();

      expect(output.metadata.companyName).toBe("TestCo");
      expect(output.strategic.diagnostic).toEqual(input.strategic.diagnostic);
      expect(output.strategic.targetMarket).toEqual(input.strategic.targetMarket);
      expect(output.strategic.businessStrategy).toEqual(input.strategic.businessStrategy);
      expect(output.strategic.feedbackLoop.hypotheses).toEqual(input.strategic.feedbackLoop.hypotheses);
      expect(output.strategic.marketingFoundation.offer).toEqual(input.strategic.marketingFoundation.offer);
      expect(output.strategic.okrs).toHaveLength(2);
      expect(output.tactical.marketingPlan.campaigns).toHaveLength(2);
      expect(output.tactical.marketingPlan.channelStrategy).toHaveLength(1);
      expect(output.tactical.marketingPlan.contentPlan).toHaveLength(1);
      expect(output.tactical.marketingPlan.budgetAllocation).toHaveLength(1);
      expect(output.tactical.marketingPlan.kpis).toHaveLength(1);
      expect(output.tactical.marketingPlan.roadmap).toHaveLength(1);
      expect(output.tactical.marketingSystem.processes).toHaveLength(1);
      expect(output.tactical.marketingSystem.backlog).toHaveLength(1);
      expect(output.tactical.marketingSystem.automations).toHaveLength(1);
      expect(output.operational.tasks).toHaveLength(2);
      expect(output.operational.calendar).toHaveLength(1);
      expect(output.operational.weeklyKPIs).toHaveLength(1);
      expect(output.constraints).toEqual(input.constraints);
      expect(output.narrativeSummary).toBe(input.narrativeSummary);
    });

    it("should return defensive copies of arrays", () => {
      const input = makeStrategy();
      const aggregate = StrategyAggregate.create(input);
      const output1 = aggregate.toStrategy();
      const output2 = aggregate.toStrategy();

      // Different array references
      expect(output1.strategic.okrs).not.toBe(output2.strategic.okrs);
      expect(output1.tactical.marketingPlan.campaigns).not.toBe(output2.tactical.marketingPlan.campaigns);
      expect(output1.operational.tasks).not.toBe(output2.operational.tasks);
      // But equal content
      expect(output1.strategic.okrs).toEqual(output2.strategic.okrs);
    });
  });
});
