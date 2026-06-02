import { describe, it, expect } from "vitest";
import {
  assessPriorityPyramid,
  getItemDetail,
  PYRAMID_ITEMS,
  FOUNDATION_ITEMS,
  TIER_ORDER,
} from "@/domains/strategy/services/priority-pyramid";
import type { MarketingStrategy } from "@/types/marketing-strategy";
import { makeStrategy } from "@/__tests__/fixtures/strategy.fixture";

describe("priority pyramid catalog", () => {
  it("has 10 fully-tracked foundation items", () => {
    expect(FOUNDATION_ITEMS).toHaveLength(10);
    expect(FOUNDATION_ITEMS.every((i) => i.tracked && typeof i.covered === "function")).toBe(true);
  });

  it("never marks a surface item as tracked", () => {
    const surface = PYRAMID_ITEMS.filter((i) => i.tier === "surface");
    expect(surface.length).toBeGreaterThan(0);
    expect(surface.every((i) => !i.tracked)).toBe(true);
  });

  it("gives every tracked item a coverage predicate and every untracked item none", () => {
    for (const item of PYRAMID_ITEMS) {
      if (item.tracked) expect(typeof item.covered).toBe("function");
      else expect(item.covered).toBeUndefined();
    }
  });
});

describe("assessPriorityPyramid — full strategy", () => {
  const assessment = assessPriorityPyramid(makeStrategy());

  it("scores foundation-first at 100 when every foundation is populated", () => {
    expect(assessment.foundationFirstScore).toBe(100);
    expect(assessment.verdict).toBe("foundation-first");
    expect(assessment.noiseRisk).toBe(false);
  });

  it("orders tiers base-first (foundation → leverage → surface)", () => {
    expect(assessment.tiers.map((t) => t.tier)).toEqual([...TIER_ORDER]);
  });

  it("covers all tracked foundation items", () => {
    const foundation = assessment.tiers.find((t) => t.tier === "foundation")!;
    expect(foundation.coveredCount).toBe(foundation.trackedCount);
    expect(foundation.coveredCount).toBe(10);
  });

  it("reports surface items as untracked, never missing", () => {
    const surface = assessment.tiers.find((t) => t.tier === "surface")!;
    expect(surface.trackedCount).toBe(0);
    expect(surface.items.every((i) => i.status === "untracked")).toBe(true);
  });
});

describe("assessPriorityPyramid — sparse strategy", () => {
  // Hollow out the entire strategic foundation while keeping the object valid-shaped.
  function makeSparse(): MarketingStrategy {
    const s = makeStrategy();
    s.strategic.targetMarket.icp.description = "";
    s.strategic.targetMarket.icp.painPoints = [];
    s.strategic.targetMarket.marketDefinition = "";
    s.strategic.targetMarket.segments = [];
    s.strategic.businessStrategy.valueProposition = "";
    s.strategic.businessStrategy.uniqueDifferentiator = "";
    s.strategic.businessStrategy.vision = "";
    s.strategic.marketingFoundation.offer = "";
    s.strategic.marketingFoundation.positioning.uniqueValue = "";
    s.strategic.marketingFoundation.positioning.targetMarket = "";
    s.strategic.marketingFoundation.messaging.primaryMessage = "";
    s.strategic.feedbackLoop.hypotheses = [];
    s.strategic.feedbackLoop.reviewCadence = "";
    s.tactical.marketingSystem.processes = [];
    s.narrativeSummary = "";
    return s;
  }

  const assessment = assessPriorityPyramid(makeSparse());

  it("drops the foundation-first score to 0 and flags noise risk", () => {
    expect(assessment.foundationFirstScore).toBe(0);
    expect(assessment.verdict).toBe("fragile");
    expect(assessment.noiseRisk).toBe(true);
  });

  it("marks every foundation item as missing", () => {
    const foundation = assessment.tiers.find((t) => t.tier === "foundation")!;
    expect(foundation.coveredCount).toBe(0);
    expect(foundation.items.every((i) => i.status === "missing")).toBe(true);
  });
});

describe("item detail extraction", () => {
  const full = makeStrategy();

  it("attaches a detail to every assessed item", () => {
    const items = assessPriorityPyramid(full).tiers.flatMap((t) => t.items);
    expect(items.every((i) => i.detail !== undefined)).toBe(true);
  });

  it("extracts the stored ICP data for a covered foundation item", () => {
    const icp = PYRAMID_ITEMS.find((i) => i.id === "precise-icp")!;
    const detail = getItemDetail(icp, full);
    expect(detail.note).toBeUndefined();
    const desc = detail.fields.find((f) => f.label === "Description");
    expect(desc?.values[0]).toBe(full.strategic.targetMarket.icp.description);
    const pains = detail.fields.find((f) => f.label === "Pain points");
    expect(pains?.values).toEqual(full.strategic.targetMarket.icp.painPoints);
  });

  it("returns a 'no data' note for a tracked-but-empty item", () => {
    const sparse = makeStrategy();
    sparse.strategic.marketingFoundation.offer = "";
    const offers = PYRAMID_ITEMS.find((i) => i.id === "offers")!;
    const detail = getItemDetail(offers, sparse);
    expect(detail.fields).toHaveLength(0);
    expect(detail.note).toBeTruthy();
  });

  it("returns the 'noise' note for surface items", () => {
    const trend = PYRAMID_ITEMS.find((i) => i.id === "new-trends")!;
    const detail = getItemDetail(trend, full);
    expect(detail.fields).toHaveLength(0);
    expect(detail.note).toMatch(/noise/i);
  });

  it("returns a 'not modeled' note for untracked leverage items", () => {
    const intent = PYRAMID_ITEMS.find((i) => i.id === "intent-signals")!;
    const detail = getItemDetail(intent, full);
    expect(detail.fields).toHaveLength(0);
    expect(detail.note).toMatch(/not modeled/i);
  });
});

describe("assessPriorityPyramid — partial foundation", () => {
  it("scores between bounds and reports the 'building' verdict", () => {
    const s = makeStrategy();
    // Knock out 4 of 10 foundations → 60% covered.
    s.strategic.businessStrategy.valueProposition = "";
    s.strategic.businessStrategy.uniqueDifferentiator = "";
    s.strategic.marketingFoundation.offer = "";
    s.strategic.feedbackLoop.hypotheses = [];

    const assessment = assessPriorityPyramid(s);
    expect(assessment.foundationFirstScore).toBe(60);
    expect(assessment.verdict).toBe("building");
    expect(assessment.noiseRisk).toBe(false);
  });
});
