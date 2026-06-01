import { describe, it, expect } from "vitest";
import {
  scoreFoundationCoverage,
  foundationCoverageScorer,
  FOUNDATION_CONCEPTS,
} from "../foundation-coverage";

describe("scoreFoundationCoverage", () => {
  it("returns 0 for empty text", () => {
    expect(scoreFoundationCoverage("")).toBe(0);
  });

  it("rises with the number of foundation concepts covered", () => {
    const one = scoreFoundationCoverage("Notre proposition de valeur est claire.");
    const several = scoreFoundationCoverage(
      "Proposition de valeur forte, positionnement clair, messaging cohérent et un ICP précis."
    );
    expect(one).toBeGreaterThan(0);
    expect(several).toBeGreaterThan(one);
  });

  it("is blind to surface noise (does not reward trends/hacks/virality)", () => {
    const noise = scoreFoundationCoverage(
      "On mise sur les nouvelles tendances, des growth hacks et la viralité avec une AI automation."
    );
    expect(noise).toBe(0);
  });

  it("stays within [0,1]", () => {
    const s = scoreFoundationCoverage("offre ".repeat(50));
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
    expect(FOUNDATION_CONCEPTS.length).toBe(10);
  });
});

describe("foundationCoverageScorer", () => {
  it("builds with the expected id and description", () => {
    expect(foundationCoverageScorer.id).toBe("foundation-coverage");
    expect(foundationCoverageScorer.config.description).toContain("foundation");
  });
});
