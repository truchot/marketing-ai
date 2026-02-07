// ============================================================
// Value Objects - Unit Tests
// Tests for Sector, BrandTone, TargetAudience, and EpisodeType
// ============================================================

import { describe, it, expect } from "vitest";
import {
  Sector,
  BrandTone,
  TargetAudience,
  EpisodeType,
} from "./value-objects";

describe("Sector Value Object", () => {
  it("should create valid sectors", () => {
    const saas = Sector.create("saas");
    expect(saas.value).toBe("saas");

    const ecommerce = Sector.create("ecommerce");
    expect(ecommerce.value).toBe("ecommerce");

    const agency = Sector.create("agency");
    expect(agency.value).toBe("agency");

    const startup = Sector.create("startup");
    expect(startup.value).toBe("startup");

    const b2c = Sector.create("b2c");
    expect(b2c.value).toBe("b2c");

    const other = Sector.create("other");
    expect(other.value).toBe("other");
  });

  it("should normalize sector values (lowercase and trim)", () => {
    const saas = Sector.create("  SaaS  ");
    expect(saas.value).toBe("saas");
  });

  it("should use predefined constants", () => {
    expect(Sector.SAAS.value).toBe("saas");
    expect(Sector.ECOMMERCE.value).toBe("ecommerce");
    expect(Sector.AGENCY.value).toBe("agency");
    expect(Sector.STARTUP.value).toBe("startup");
    expect(Sector.B2C.value).toBe("b2c");
    expect(Sector.OTHER.value).toBe("other");
  });

  it("should throw error for invalid sectors", () => {
    expect(() => Sector.create("invalid")).toThrow(
      'Invalid sector: "invalid". Valid sectors: saas, ecommerce, agency, startup, b2c, other'
    );
  });

  it("should compare sectors correctly", () => {
    const saas1 = Sector.create("saas");
    const saas2 = Sector.create("saas");
    const ecommerce = Sector.create("ecommerce");

    expect(saas1.equals(saas2)).toBe(true);
    expect(saas1.equals(ecommerce)).toBe(false);
  });

  it("should convert to string", () => {
    const sector = Sector.create("saas");
    expect(sector.toString()).toBe("saas");
  });
});

describe("BrandTone Value Object", () => {
  it("should create valid brand tones", () => {
    const professional = BrandTone.create("professional");
    expect(professional.value).toBe("professional");

    const casual = BrandTone.create("casual");
    expect(casual.value).toBe("casual");
  });

  it("should accept custom brand tone values", () => {
    const custom = BrandTone.create("quirky and innovative");
    expect(custom.value).toBe("quirky and innovative");
  });

  it("should normalize brand tone values (lowercase and trim)", () => {
    const tone = BrandTone.create("  Professional  ");
    expect(tone.value).toBe("professional");
  });

  it("should throw error for empty brand tone", () => {
    expect(() => BrandTone.create("")).toThrow("Brand tone cannot be empty");
    expect(() => BrandTone.create("   ")).toThrow(
      "Brand tone cannot be empty"
    );
  });

  it("should compare brand tones correctly", () => {
    const casual1 = BrandTone.create("casual");
    const casual2 = BrandTone.create("casual");
    const professional = BrandTone.create("professional");

    expect(casual1.equals(casual2)).toBe(true);
    expect(casual1.equals(professional)).toBe(false);
  });

  it("should convert to string", () => {
    const tone = BrandTone.create("friendly");
    expect(tone.toString()).toBe("friendly");
  });
});

describe("TargetAudience Value Object", () => {
  it("should create valid target audience", () => {
    const audience = TargetAudience.create("B2B SaaS companies");
    expect(audience.value).toBe("B2B SaaS companies");
  });

  it("should trim whitespace", () => {
    const audience = TargetAudience.create("  Startups in France  ");
    expect(audience.value).toBe("Startups in France");
  });

  it("should throw error for empty target audience", () => {
    expect(() => TargetAudience.create("")).toThrow(
      "Target audience cannot be empty"
    );
    expect(() => TargetAudience.create("   ")).toThrow(
      "Target audience cannot be empty"
    );
  });

  it("should compare target audiences correctly", () => {
    const audience1 = TargetAudience.create("Developers");
    const audience2 = TargetAudience.create("Developers");
    const audience3 = TargetAudience.create("Marketers");

    expect(audience1.equals(audience2)).toBe(true);
    expect(audience1.equals(audience3)).toBe(false);
  });

  it("should convert to string", () => {
    const audience = TargetAudience.create("Tech entrepreneurs");
    expect(audience.toString()).toBe("Tech entrepreneurs");
  });
});

describe("EpisodeType Value Object", () => {
  it("should create valid episode types", () => {
    const interaction = EpisodeType.create("interaction");
    expect(interaction.value).toBe("interaction");

    const taskResult = EpisodeType.create("task_result");
    expect(taskResult.value).toBe("task_result");

    const feedback = EpisodeType.create("feedback");
    expect(feedback.value).toBe("feedback");

    const discovery = EpisodeType.create("discovery");
    expect(discovery.value).toBe("discovery");
  });

  it("should normalize episode type values (lowercase and trim)", () => {
    const type = EpisodeType.create("  Interaction  ");
    expect(type.value).toBe("interaction");
  });

  it("should use predefined constants", () => {
    expect(EpisodeType.INTERACTION.value).toBe("interaction");
    expect(EpisodeType.TASK_RESULT.value).toBe("task_result");
    expect(EpisodeType.FEEDBACK.value).toBe("feedback");
    expect(EpisodeType.DISCOVERY.value).toBe("discovery");
  });

  it("should throw error for invalid episode types", () => {
    expect(() => EpisodeType.create("invalid")).toThrow(
      'Invalid episode type: "invalid". Valid types: interaction, task_result, feedback, discovery'
    );
  });

  it("should compare episode types correctly", () => {
    const type1 = EpisodeType.create("interaction");
    const type2 = EpisodeType.create("interaction");
    const type3 = EpisodeType.create("feedback");

    expect(type1.equals(type2)).toBe(true);
    expect(type1.equals(type3)).toBe(false);
  });

  it("should convert to string", () => {
    const type = EpisodeType.create("discovery");
    expect(type.toString()).toBe("discovery");
  });
});
