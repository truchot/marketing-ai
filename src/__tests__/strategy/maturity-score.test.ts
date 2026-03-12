import { describe, it, expect } from "vitest";
import type { BusinessDiscovery } from "@/types/business-discovery";

// We test the maturity score calculation logic in isolation.
// Since generateDiagnostic calls Claude Haiku (external), we extract
// and replicate the deterministic scoring logic here.

function calculateMaturityScore(discovery: BusinessDiscovery): {
  channelScore: number;
  teamScore: number;
  toolScore: number;
  budgetScore: number;
  strategyScore: number;
  total: number;
} {
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

  // 4. Budget (0-20)
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

  return {
    channelScore,
    teamScore,
    toolScore,
    budgetScore,
    strategyScore,
    total: channelScore + teamScore + toolScore + budgetScore + strategyScore,
  };
}

function makeMinimalDiscovery(
  overrides: Record<string, unknown> = {}
): BusinessDiscovery {
  return {
    metadata: {
      companyName: "TestCo",
      interviewDate: "2026-01-01",
      intervieweeName: "John",
      intervieweeRole: "CEO",
      sector: "saas",
      completionStatus: "complete",
      gaps: [],
    },
    problem: {
      statement: "Test problem",
      painLevel: "bloquant",
      frequency: "Daily",
      currentAlternatives: [],
    },
    valueProposition: {
      transformation: { before: "A", after: "B", timeToValue: "1 month" },
      uniqueDifferentiator: "Test",
      proofPoints: [],
    },
    audiences: [],
    currentMarketing: {
      channels: [],
      abandonedChannels: [],
      bestPerforming: null,
      biggestGap: null,
      team: { size: 0, dedicatedToMarketing: false, skills: [], gaps: [] },
      budget: { range: "", allocation: "", flexibility: "undefined" },
      tools: [],
    },
    businessContext: {
      stage: "launch",
      stageDetails: "Just starting",
      primaryGoal: { description: "Grow", metric: null, timeline: "" },
      constraints: [],
      upcomingEvents: [],
      urgency: "medium",
    },
    narrativeSummary: "Test",
    strategicHypotheses: [],
    ...overrides,
  } as BusinessDiscovery;
}

describe("Maturity Score Calculation", () => {
  describe("channels dimension (0-20)", () => {
    it("should return 0 for no channels", () => {
      const discovery = makeMinimalDiscovery();
      const { channelScore } = calculateMaturityScore(discovery);
      expect(channelScore).toBe(0);
    });

    it("should score higher for more channels", () => {
      const discovery = makeMinimalDiscovery({
        currentMarketing: {
          ...makeMinimalDiscovery().currentMarketing,
          channels: [
            { name: "Blog", type: "organic", frequency: "weekly", perceivedResults: "average", notes: "" },
            { name: "LinkedIn", type: "organic", frequency: "daily", perceivedResults: "average", notes: "" },
          ],
        },
      });
      const { channelScore } = calculateMaturityScore(discovery);
      expect(channelScore).toBe(8); // 2 * 4 = 8
    });

    it("should give bonus for good-performing channels", () => {
      const discovery = makeMinimalDiscovery({
        currentMarketing: {
          ...makeMinimalDiscovery().currentMarketing,
          channels: [
            { name: "Blog", type: "organic", frequency: "weekly", perceivedResults: "good", notes: "" },
          ],
        },
      });
      const { channelScore } = calculateMaturityScore(discovery);
      expect(channelScore).toBe(8); // 1*4 (active) + 1*4 (good) = 8
    });

    it("should cap at 20", () => {
      const discovery = makeMinimalDiscovery({
        currentMarketing: {
          ...makeMinimalDiscovery().currentMarketing,
          channels: Array.from({ length: 6 }, (_, i) => ({
            name: `Ch${i}`, type: "organic", frequency: "weekly", perceivedResults: "good", notes: "",
          })),
        },
      });
      const { channelScore } = calculateMaturityScore(discovery);
      expect(channelScore).toBe(20);
    });
  });

  describe("budget dimension (0-20)", () => {
    it("should return 2 for undefined flexibility with no range/allocation", () => {
      const discovery = makeMinimalDiscovery();
      const { budgetScore } = calculateMaturityScore(discovery);
      expect(budgetScore).toBe(2); // undefined=2, no range=0, no allocation=0
    });

    it("should return 20 for adjustable + range + allocation", () => {
      const discovery = makeMinimalDiscovery({
        currentMarketing: {
          ...makeMinimalDiscovery().currentMarketing,
          budget: { range: "5000-10000€/mois", allocation: "50% content, 50% paid", flexibility: "adjustable" },
        },
      });
      const { budgetScore } = calculateMaturityScore(discovery);
      expect(budgetScore).toBe(20); // 12 + 4 + 4
    });

    it("should return 14 for fixed + range + allocation", () => {
      const discovery = makeMinimalDiscovery({
        currentMarketing: {
          ...makeMinimalDiscovery().currentMarketing,
          budget: { range: "2000€/mois", allocation: "100% content", flexibility: "fixed" },
        },
      });
      const { budgetScore } = calculateMaturityScore(discovery);
      expect(budgetScore).toBe(14); // 6 + 4 + 4
    });
  });

  describe("strategy dimension (0-20)", () => {
    it("should return 2 for no metric, no timeline, no events", () => {
      const discovery = makeMinimalDiscovery();
      const { strategyScore } = calculateMaturityScore(discovery);
      expect(strategyScore).toBe(2); // no metric=0, no timeline=0, no events=2
    });

    it("should return 18 for metric + timeline + events", () => {
      const discovery = makeMinimalDiscovery({
        businessContext: {
          ...makeMinimalDiscovery().businessContext,
          primaryGoal: { description: "Grow", metric: "MRR 50k", timeline: "Q2 2026" },
          upcomingEvents: [{ event: "Launch", date: "2026-04", impact: "High" }],
        },
      });
      const { strategyScore } = calculateMaturityScore(discovery);
      expect(strategyScore).toBe(18); // 8 + 6 + 4
    });
  });

  describe("total score", () => {
    it("should return low score for minimal discovery", () => {
      const discovery = makeMinimalDiscovery();
      const { total } = calculateMaturityScore(discovery);
      // channels=0, team=3 (not dedicated, 0 size), tools=0, budget=2, strategy=2
      expect(total).toBe(7);
    });

    it("should never exceed 100", () => {
      const discovery = makeMinimalDiscovery({
        currentMarketing: {
          channels: Array.from({ length: 10 }, (_, i) => ({
            name: `Ch${i}`, type: "organic", frequency: "weekly", perceivedResults: "good", notes: "",
          })),
          abandonedChannels: [],
          bestPerforming: "Blog",
          biggestGap: null,
          team: { size: 10, dedicatedToMarketing: true, skills: ["SEO", "Content", "Paid", "Analytics", "Design"], gaps: [] },
          budget: { range: "50000€/mois", allocation: "diversifié", flexibility: "adjustable" },
          tools: Array.from({ length: 5 }, (_, i) => ({
            name: `Tool${i}`, category: "analytics", maturity: "well_configured",
          })),
        },
        businessContext: {
          stage: "scale",
          stageDetails: "Scaling fast",
          primaryGoal: { description: "Scale", metric: "ARR 1M", timeline: "2026" },
          constraints: [],
          upcomingEvents: [{ event: "IPO", date: "2026-Q4", impact: "Major" }],
          urgency: "high",
        },
      });
      const { total } = calculateMaturityScore(discovery);
      expect(total).toBeLessThanOrEqual(100);
    });
  });
});
