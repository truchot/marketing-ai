import { describe, it, expect } from "vitest";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type { ProblemAssessment, ProblemKey } from "@/types/marketing-strategy";
import {
  assessMarketingProblems,
  mergeProblemRefinements,
  selectCriticalProblems,
  PROBLEM_CATALOG,
} from "@/tools/strategy/problem-assessment";

// Minimal discovery builder (mirrors the pattern in maturity-score.test.ts).
function makeMinimalDiscovery(overrides: Record<string, unknown> = {}): BusinessDiscovery {
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
      uniqueDifferentiator: "A specific, real differentiator",
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
    unitEconomics: {
      cac: { value: null, method: null, trend: "unknown" },
      ltv: { value: null, averageLifespan: null, method: null },
      cacPayback: { months: null, known: false },
      acv: { value: null, contractType: "unknown" },
      ltvCacRatio: null,
      qualifiedRevenuePipeline: { value: null, tracked: false },
      knowledgeLevel: "none",
    },
    narrativeSummary: "Test",
    strategicHypotheses: [],
    ...overrides,
  } as BusinessDiscovery;
}

function byKey(problems: ProblemAssessment[], key: ProblemKey): ProblemAssessment {
  const p = problems.find((x) => x.key === key);
  if (!p) throw new Error(`Problem ${key} missing`);
  return p;
}

const STRATEGIC_KEYS: ProblemKey[] = [
  "undefined_audience",
  "weak_product",
  "standard_positioning",
  "painless_problem",
];

describe("assessMarketingProblems", () => {
  it("returns exactly the 16 catalogued problems, no duplicates", () => {
    const problems = assessMarketingProblems(makeMinimalDiscovery());
    expect(problems).toHaveLength(16);
    expect(PROBLEM_CATALOG).toHaveLength(16);
    const keys = problems.map((p) => p.key);
    expect(new Set(keys).size).toBe(16);
    expect(new Set(keys)).toEqual(new Set(PROBLEM_CATALOG.map((c) => c.key)));
  });

  it("flags exactly the 4 strategy-tier problems as isStrategic", () => {
    const problems = assessMarketingProblems(makeMinimalDiscovery());
    const strategic = problems.filter((p) => p.isStrategic).map((p) => p.key).sort();
    expect(strategic).toEqual([...STRATEGIC_KEYS].sort());
  });

  describe("painless_problem (measured, strategic)", () => {
    it("maps painLevel 'irritant' → critical", () => {
      const problems = assessMarketingProblems(
        makeMinimalDiscovery({ problem: { statement: "x", painLevel: "irritant", frequency: "", currentAlternatives: [] } })
      );
      const p = byKey(problems, "painless_problem");
      expect(p.severity).toBe("critical");
      expect(p.dataSufficiency).toBe("measured");
    });

    it("maps painLevel 'bloquant' → problematic", () => {
      const p = byKey(assessMarketingProblems(makeMinimalDiscovery()), "painless_problem");
      expect(p.severity).toBe("problematic");
    });

    it("maps painLevel 'critique' → easily_fixed", () => {
      const problems = assessMarketingProblems(
        makeMinimalDiscovery({ problem: { statement: "x", painLevel: "critique", frequency: "", currentAlternatives: [] } })
      );
      expect(byKey(problems, "painless_problem").severity).toBe("easily_fixed");
    });
  });

  describe("undefined_audience (measured, strategic)", () => {
    it("is critical when no audiences are defined", () => {
      const p = byKey(assessMarketingProblems(makeMinimalDiscovery()), "undefined_audience");
      expect(p.severity).toBe("critical");
      expect(p.dataSufficiency).toBe("measured");
    });

    it("is easily_fixed with a rich, prioritized primary segment", () => {
      const discovery = makeMinimalDiscovery({
        audiences: [
          {
            segment: "PME SaaS",
            priority: "primary",
            painIntensity: "high",
            triggerMoment: "After a failed launch",
            buyingContext: "Q4 budget",
            language: ["ROI", "pipeline"],
            channels: ["LinkedIn"],
            objections: [],
          },
        ],
      });
      expect(byKey(assessMarketingProblems(discovery), "undefined_audience").severity).toBe("easily_fixed");
    });
  });

  describe("standard_positioning (strategic)", () => {
    it("is critical and measured when no differentiator is captured", () => {
      const discovery = makeMinimalDiscovery({
        valueProposition: {
          transformation: { before: "A", after: "B", timeToValue: "1 month" },
          uniqueDifferentiator: "   ",
          proofPoints: [],
        },
      });
      const p = byKey(assessMarketingProblems(discovery), "standard_positioning");
      expect(p.severity).toBe("critical");
      expect(p.dataSufficiency).toBe("measured");
    });

    it("is inferred (deferred to LLM) when a differentiator is present", () => {
      const p = byKey(assessMarketingProblems(makeMinimalDiscovery()), "standard_positioning");
      expect(p.dataSufficiency).toBe("inferred");
    });
  });

  describe("wrong_talents (measured)", () => {
    it("is deep when there is no marketing team", () => {
      expect(byKey(assessMarketingProblems(makeMinimalDiscovery()), "wrong_talents").severity).toBe("deep");
    });

    it("is easily_fixed when a team exists with no skill gaps", () => {
      const discovery = makeMinimalDiscovery({
        currentMarketing: {
          ...makeMinimalDiscovery().currentMarketing,
          team: { size: 3, dedicatedToMarketing: true, skills: ["SEO", "Content"], gaps: [] },
        },
      });
      expect(byKey(assessMarketingProblems(discovery), "wrong_talents").severity).toBe("easily_fixed");
    });

    it("is deep when gaps outnumber skills", () => {
      const discovery = makeMinimalDiscovery({
        currentMarketing: {
          ...makeMinimalDiscovery().currentMarketing,
          team: { size: 2, dedicatedToMarketing: false, skills: ["SEO"], gaps: ["Paid", "Analytics"] },
        },
      });
      expect(byKey(assessMarketingProblems(discovery), "wrong_talents").severity).toBe("deep");
    });
  });

  describe("poor_measurement (measured)", () => {
    it("is deep with no metric and no unit-economics knowledge", () => {
      expect(byKey(assessMarketingProblems(makeMinimalDiscovery()), "poor_measurement").severity).toBe("deep");
    });

    it("is easily_fixed when a measurable primary goal exists", () => {
      const discovery = makeMinimalDiscovery({
        businessContext: {
          ...makeMinimalDiscovery().businessContext,
          primaryGoal: { description: "Grow", metric: "MRR 50k", timeline: "Q2" },
        },
      });
      expect(byKey(assessMarketingProblems(discovery), "poor_measurement").severity).toBe("easily_fixed");
    });
  });

  describe("honesty — unmeasurable problems", () => {
    it("flags product, creative, and innovation as insufficient", () => {
      const problems = assessMarketingProblems(makeMinimalDiscovery());
      for (const key of ["weak_product", "bad_creative", "no_innovation"] as ProblemKey[]) {
        const p = byKey(problems, key);
        expect(p.dataSufficiency).toBe("insufficient");
        expect(p.evidence.toLowerCase()).toContain("insufficient data");
      }
    });
  });
});

describe("selectCriticalProblems", () => {
  it("selects problems at the critical band", () => {
    // Minimal discovery → undefined_audience is critical
    const critical = selectCriticalProblems(assessMarketingProblems(makeMinimalDiscovery()));
    expect(critical).toContain("undefined_audience");
  });

  it("selects strategy-tier problems that reach the deep band", () => {
    const problems: ProblemAssessment[] = [
      { key: "weak_product", label: "x", severity: "deep", isStrategic: true, evidence: "", recommendation: "", confidence: "low", dataSufficiency: "inferred" },
      { key: "poor_systems", label: "x", severity: "deep", isStrategic: false, evidence: "", recommendation: "", confidence: "low", dataSufficiency: "measured" },
    ];
    const critical = selectCriticalProblems(problems);
    expect(critical).toContain("weak_product"); // strategic + deep
    expect(critical).not.toContain("poor_systems"); // non-strategic deep is not critical
  });
});

describe("mergeProblemRefinements", () => {
  const base = (): ProblemAssessment[] => [
    { key: "undefined_audience", label: "x", severity: "critical", isStrategic: true, evidence: "det", recommendation: "r", confidence: "high", dataSufficiency: "measured" },
    { key: "weak_product", label: "x", severity: "normal", isStrategic: true, evidence: "Insufficient data — product quality is not captured by discovery.", recommendation: "r", confidence: "low", dataSufficiency: "insufficient" },
    { key: "outdated_tactics", label: "x", severity: "normal", isStrategic: false, evidence: "det", recommendation: "r", confidence: "low", dataSufficiency: "inferred" },
  ];

  it("never overrides a measured assessment", () => {
    const merged = mergeProblemRefinements(base(), [
      { key: "undefined_audience", severity: "easily_fixed", evidence: "llm" },
    ]);
    const p = merged.find((x) => x.key === "undefined_audience")!;
    expect(p.severity).toBe("critical");
    expect(p.evidence).toBe("det");
  });

  it("applies a refinement to an inferred problem and marks it inferred", () => {
    const merged = mergeProblemRefinements(base(), [
      { key: "outdated_tactics", severity: "problematic", confidence: "medium", evidence: "llm reasoning" },
    ]);
    const p = merged.find((x) => x.key === "outdated_tactics")!;
    expect(p.severity).toBe("problematic");
    expect(p.confidence).toBe("medium");
    expect(p.evidence).toBe("llm reasoning");
    expect(p.dataSufficiency).toBe("inferred");
  });

  it("keeps insufficient when the LLM confirms it cannot judge", () => {
    const merged = mergeProblemRefinements(base(), [
      { key: "weak_product", dataSufficiency: "insufficient" },
    ]);
    expect(merged.find((x) => x.key === "weak_product")!.dataSufficiency).toBe("insufficient");
  });

  it("ignores an invalid severity value", () => {
    const merged = mergeProblemRefinements(base(), [
      // @ts-expect-error — invalid severity is filtered at runtime
      { key: "outdated_tactics", severity: "catastrophic" },
    ]);
    expect(merged.find((x) => x.key === "outdated_tactics")!.severity).toBe("normal");
  });

  it("leaves problems untouched when no refinement is provided", () => {
    const merged = mergeProblemRefinements(base(), []);
    expect(merged).toEqual(base());
  });
});
