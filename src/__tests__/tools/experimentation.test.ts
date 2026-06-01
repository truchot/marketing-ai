import { describe, it, expect } from "vitest";
import {
  toConfidenceSources,
  deriveConfidence,
  buildCompetitorAnglesPrompt,
  buildVariantsPrompt,
  type CompetitorIntel,
} from "@/tools/experimentation";
import {
  isExperimentBacklog,
  experimentBacklogSchema,
} from "@/agents/growth-strategist";

function makeIntel(overrides: Partial<CompetitorIntel> = {}): CompetitorIntel {
  return {
    analyzed: ["https://a.com", "https://b.com"],
    angles: [
      { angle: "gain de temps", prevalence: 2 },
      { angle: "peur de l'erreur", prevalence: 1 },
    ],
    gaps: ["accompagnement humain"],
    ...overrides,
  };
}

describe("toConfidenceSources", () => {
  it("maps each angle to a competitor_intel source plus one for the gaps", () => {
    const sources = toConfidenceSources(makeIntel());
    expect(sources).toHaveLength(3); // 2 angles + 1 gaps
    expect(sources.every((s) => s.type === "competitor_intel")).toBe(true);
    expect(sources[0].evidence).toContain("gain de temps");
    expect(sources[0].evidence).toContain("2/2");
    expect(sources[2].evidence).toContain("accompagnement humain");
  });

  it("omits the gaps source when there are no gaps", () => {
    const sources = toConfidenceSources(makeIntel({ gaps: [] }));
    expect(sources).toHaveLength(2);
  });

  it("returns an empty array for empty intel", () => {
    expect(toConfidenceSources({ analyzed: [], angles: [], gaps: [] })).toEqual([]);
  });
});

describe("deriveConfidence", () => {
  it("returns 3 (cold start) when nothing was analyzed", () => {
    expect(deriveConfidence({ analyzed: [], angles: [], gaps: [] })).toBe(3);
  });

  it("rewards observed angles and an exploitable gap", () => {
    // 4 base + min(2,3) angles + 1 gap = 7
    expect(deriveConfidence(makeIntel())).toBe(7);
  });

  it("caps the angle signal at +3", () => {
    const intel = makeIntel({
      angles: [
        { angle: "a", prevalence: 1 },
        { angle: "b", prevalence: 1 },
        { angle: "c", prevalence: 1 },
        { angle: "d", prevalence: 1 },
      ],
      gaps: [],
    });
    expect(deriveConfidence(intel)).toBe(7); // 4 + 3 + 0
  });

  it("returns the base 4 when pages were analyzed but no angle/gap found", () => {
    expect(deriveConfidence({ analyzed: ["https://a.com"], angles: [], gaps: [] })).toBe(4);
  });
});

describe("buildCompetitorAnglesPrompt", () => {
  it("includes the competitor pages, the sector and a strict-JSON instruction", () => {
    const prompt = buildCompetitorAnglesPrompt(
      [{ url: "https://a.com", text: "contenu A" }],
      "SaaS compta"
    );
    expect(prompt).toContain("https://a.com");
    expect(prompt).toContain("contenu A");
    expect(prompt).toContain("SaaS compta");
    expect(prompt).toContain('"angles"');
    expect(prompt).toContain('"gaps"');
  });
});

describe("buildVariantsPrompt", () => {
  const base = {
    hypothesis: {
      belief: "poster une série",
      audience: "freelances",
      outcome: "des essais",
      successMetric: "CTR",
      threshold: "> 2%",
    },
    channel: "linkedin",
    brandTone: "direct et chaleureux",
    format: "linkedin_post",
  };

  it("embeds the hypothesis, threshold, channel, tone and format", () => {
    const prompt = buildVariantsPrompt(base);
    expect(prompt).toContain("> 2%");
    expect(prompt).toContain("linkedin");
    expect(prompt).toContain("direct et chaleureux");
    expect(prompt).toContain("linkedin_post");
  });

  it("defaults to 3 variants and honours an explicit count", () => {
    expect(buildVariantsPrompt(base)).toContain("3 variantes");
    expect(buildVariantsPrompt({ ...base, count: 5 })).toContain("5 variantes");
  });
});

describe("isExperimentBacklog", () => {
  it("accepts an object with a candidates array", () => {
    expect(isExperimentBacklog({ candidates: [] })).toBe(true);
  });

  it("rejects null, non-objects and malformed shapes", () => {
    expect(isExperimentBacklog(null)).toBe(false);
    expect(isExperimentBacklog({})).toBe(false);
    expect(isExperimentBacklog({ candidates: "nope" })).toBe(false);
  });
});

describe("experimentBacklogSchema", () => {
  it("is a json-schema object requiring candidates", () => {
    expect(experimentBacklogSchema.type).toBe("object");
    expect(experimentBacklogSchema.required).toContain("candidates");
  });
});
