import { describe, it, expect } from "vitest";
import {
  scoreDiscoveryCompleteness,
  discoveryCompletenessScorer,
  DISCOVERY_DIMENSIONS,
} from "../discovery-completeness";

describe("scoreDiscoveryCompleteness", () => {
  it("retourne 0 pour un texte vide", () => {
    expect(scoreDiscoveryCompleteness("")).toBe(0);
  });

  it("monte avec le nombre de dimensions couvertes", () => {
    const oneDim = scoreDiscoveryCompleteness("Parlons du problème principal.");
    const threeDims = scoreDiscoveryCompleteness(
      "Le problème est clair, la proposition de valeur est forte, et l'audience cible est définie."
    );
    expect(oneDim).toBeGreaterThan(0);
    expect(threeDims).toBeGreaterThan(oneDim);
  });

  it("retourne 1 quand les 5 dimensions sont présentes", () => {
    const full =
      "problème, proposition de valeur, audience cible, canaux marketing (SEO), objectifs business et budget.";
    expect(scoreDiscoveryCompleteness(full)).toBe(1);
  });

  it("score borné dans [0,1]", () => {
    const s = scoreDiscoveryCompleteness("problème ".repeat(50));
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
    expect(DISCOVERY_DIMENSIONS.length).toBe(5);
  });
});

describe("discoveryCompletenessScorer", () => {
  it("se construit avec l'id et la description attendus", () => {
    expect(discoveryCompletenessScorer.id).toBe("discovery-completeness");
    expect(discoveryCompletenessScorer.config.description).toContain("BusinessDiscovery");
  });
});
