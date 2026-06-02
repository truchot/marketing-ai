// ============================================================
// Demo data — a fully-populated MarketingStrategy used only by the
// /strategy/demo preview route to showcase the PriorityPyramid with
// every tracked tier covered. Not used in production flows.
// ============================================================

import type { MarketingStrategy } from "@/types/marketing-strategy";

export const DEMO_STRATEGY: MarketingStrategy = {
  metadata: {
    companyName: "Acme Studio (demo)",
    generatedAt: "2026-06-02T00:00:00.000Z",
    discoveryCompletionStatus: "complete",
    strategyVersion: 1,
  },
  strategic: {
    diagnostic: {
      maturityScore: 78,
      strengths: ["Strong founder brand", "Clear ICP"],
      weaknesses: ["No paid acquisition"],
      opportunities: ["Content repurposing", "Partnerships"],
      threats: ["Crowded category"],
      summary: "Solid foundations, ready to scale leverage tactics.",
    },
    targetMarket: {
      marketDefinition: "B2B SaaS founders in EU scaling from seed to series A",
      segments: [
        {
          segment: "Seed-stage SaaS founders",
          priority: "primary",
          mainPain: "No repeatable marketing engine",
          targetMessage: "Build a marketing engine that compounds",
        },
        {
          segment: "Fractional CMOs",
          priority: "secondary",
          mainPain: "Need a reusable strategy framework",
          targetMessage: "A system your clients can run",
        },
      ],
      icp: {
        description: "Technical founder, 5-30 employees, €1-5M ARR, EU-based",
        painPoints: ["Inconsistent pipeline", "Founder-led sales doesn't scale"],
        triggerMoments: ["Just raised a round", "Hired first marketer"],
        buyingContext: "Evaluates after a growth plateau",
        preferredChannels: ["LinkedIn", "Newsletter", "Podcasts"],
        commonObjections: ["Too early for a system", "We'll do it in-house"],
        decisionCriteria: ["Proven ROI", "Time-to-value", "Founder fit"],
      },
    },
    businessStrategy: {
      vision: "Become the default operating system for founder-led marketing",
      valueProposition: "Turn scattered marketing into a compounding, measurable system",
      transformation: {
        before: "Random acts of marketing",
        after: "A documented engine that compounds monthly",
        timeToValue: "45 days",
      },
      uniqueDifferentiator: "Strategy framework + AI execution in one workspace",
      competitiveAngle: "System over tactics",
      businessStage: "growth",
      revenueTargets: {
        targetCac: "< €400",
        targetLtvCacRatio: "> 4x",
        targetCacPayback: "< 9 months",
        targetPipeline: "€1.2M qualified / quarter",
        revenueModel: "Marketing generates SQLs closed by founder-led sales",
      },
    },
    feedbackLoop: {
      hypotheses: [
        "Repurposing one pillar into 8 assets doubles reach without more production",
        "Warm outbound to engaged readers converts 3x cold outbound",
      ],
      validationTests: [
        {
          hypothesis: "Repurposing doubles reach",
          metric: "Impressions per pillar",
          method: "Cohort analysis",
          successCriteria: ">2x vs baseline",
          timeline: "8 weeks",
          status: "untested",
          linkedKpiIds: [],
        },
      ],
      reviewCadence: "weekly",
      pivotTriggers: ["<2 SQLs/month after 90 days"],
    },
    marketingFoundation: {
      offer: "Quarterly marketing system sprint + AI workspace access",
      positioning: {
        targetMarket: "Founder-led B2B SaaS",
        uniqueValue: "A compounding marketing engine, not one-off campaigns",
        competitiveAngle: "System over hacks",
        brandPersonality: "Sharp, generous, no-fluff operator",
      },
      messaging: {
        primaryMessage: "Stop doing random marketing. Build an engine.",
        segmentMessages: [
          { segment: "Seed founders", message: "Your first repeatable engine", tone: "direct" },
          { segment: "Fractional CMOs", message: "A system your clients keep", tone: "peer" },
        ],
        proofPoints: ["120+ founders onboarded", "Avg 3.2x pipeline in 2 quarters"],
      },
    },
    okrs: [
      {
        id: "okr-1",
        objective: "Build a compounding inbound engine",
        rationale: "Founder brand is the strongest asset",
        keyResults: [
          {
            id: "kr-1",
            metric: "Newsletter subscribers",
            current: "1,200",
            target: "10,000",
            timeline: "Q4 2026",
            confidence: "medium",
          },
        ],
        priority: "primary",
        linkedDiscoveryData: { fromBlock: "marketing_landscape", evidence: "Founder posts already drive most leads" },
      },
    ],
    timeHorizon: "12 months",
    roadmapValidation: {
      strategySummary: {
        whoWeHelp: "Founder-led B2B SaaS",
        whatProblem: "No repeatable marketing engine",
        howWeDiffer: "Strategy framework + AI execution",
        whatWeSay: "Build an engine, not campaigns",
      },
      readinessScore: 88,
      gaps: [],
      recommendation: "proceed",
    },
  },
  tactical: {
    marketingPlan: {
      campaigns: [
        {
          id: "campaign-1",
          okrId: "okr-1",
          name: "Founder-led thought leadership",
          objective: "Grow qualified audience",
          targetSegment: "Seed founders",
          funnelStage: "awareness",
          channels: ["LinkedIn", "Newsletter"],
          contentThemes: ["Marketing systems", "Founder-led growth"],
          keyMessages: ["Build an engine"],
          duration: "12 weeks",
          successMetric: "Qualified subscribers",
        },
      ],
      channelStrategy: [
        {
          channel: "LinkedIn",
          role: "acquisition",
          funnelStages: ["awareness", "consideration"],
          targetSegments: ["Seed founders"],
          frequency: "5 posts/week",
          contentTypes: ["post", "carousel"],
          estimatedBudget: "€0 (organic)",
        },
        {
          channel: "Warm email",
          role: "nurturing",
          funnelStages: ["consideration", "conversion"],
          targetSegments: ["Seed founders"],
          frequency: "weekly",
          contentTypes: ["newsletter"],
          estimatedBudget: "€80/mo",
        },
      ],
      contentPlan: [
        {
          pillar: "Marketing systems",
          themes: ["Engines vs campaigns", "Repurposing"],
          formats: ["essay", "carousel", "video"],
          cadence: "1 pillar/week → 8 assets",
          targetSegment: "Seed founders",
        },
      ],
      budgetAllocation: [
        {
          channel: "Warm email",
          monthlyBudget: "€80",
          percentage: 100,
          justification: "Owned channel, highest intent",
          expectedCac: "€350",
          expectedRoas: "4.1x",
        },
      ],
      kpis: [
        { id: "kpi-1", campaignId: "campaign-1", metric: "Subscribers", baseline: "1,200", target: "10,000", trackingMethod: "ESP analytics" },
      ],
      roadmap: [
        {
          phase: "Phase 1 — Engine",
          startWeek: "W1",
          endWeek: "W12",
          focus: "Pillar + repurposing system",
          campaigns: ["campaign-1"],
          milestones: ["Repurposing workflow live"],
        },
      ],
      reviewCycle: "4 weeks",
    },
    marketingSystem: {
      backlog: [
        {
          id: "backlog-1",
          title: "Set up repurposing workflow",
          type: "automation",
          description: "Pillar → 8 derivative assets",
          priority: "high",
          status: "in_progress",
          estimatedEffort: "1 day",
          linkedCampaignIds: ["campaign-1"],
        },
      ],
      processes: [
        {
          id: "process-1",
          name: "Content production",
          description: "Weekly pillar production and review",
          steps: ["Outline", "Draft", "Review", "Repurpose", "Schedule"],
          frequency: "weekly",
          owner: "Content Lead",
          tools: ["Notion", "Descript"],
        },
      ],
      automations: [
        {
          id: "auto-1",
          name: "Pillar repurposing",
          trigger: "Pillar approved in Notion",
          action: "Generate 8 derivative drafts",
          tool: "AI workspace",
          linkedProcessId: "process-1",
        },
      ],
      systemArchitecture: {
        tools: [
          { name: "Notion", role: "Content hub", category: "content", integrations: ["AI workspace"], configurationNeeded: "Templates" },
        ],
        dataFlows: [{ from: "Notion", to: "ESP", data: "Published content" }],
      },
    },
  },
  operational: {
    tasks: [
      {
        id: "task-1",
        campaignId: "campaign-1",
        title: "Write first pillar essay",
        description: "Engines vs campaigns",
        owner: "Content Lead",
        deadline: "W1",
        priority: "high",
        status: "todo",
        estimatedHours: 6,
        dependencies: [],
        deliverable: "Published essay",
      },
    ],
    calendar: [
      { week: "W1", tasks: [{ taskId: "task-1", channel: "Newsletter", contentType: "essay", topic: "Engines vs campaigns" }] },
    ],
    weeklyKPIs: [{ metric: "New subscribers", targetPerWeek: "200", trackingTool: "ESP" }],
  },
  constraints: { budgetFit: true, teamFit: true, adaptations: [] },
  narrativeSummary:
    "Acme Studio helps founder-led B2B SaaS teams turn scattered marketing into a compounding engine — a clear ICP, sharp positioning, and a repurposing system that multiplies every pillar.",
};
