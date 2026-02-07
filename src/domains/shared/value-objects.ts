// ============================================================
// Shared Kernel - Value Objects
// Lightweight, immutable value objects with validation.
// ============================================================

/**
 * MemoryId wraps a string identifier that follows the pattern: prefix-timestamp-random.
 * Examples: "ep-1700000000000-a1b2c", "fact-1700000000000-x9y8z"
 */
export class MemoryId {
  private static readonly FORMAT = /^[a-z]+-\d+-[a-z0-9]+$/;

  private constructor(readonly value: string) {}

  static create(value: string): MemoryId {
    if (!value || !MemoryId.FORMAT.test(value)) {
      throw new Error(
        `Invalid MemoryId format: "${value}". Expected pattern: prefix-timestamp-random (e.g. "ep-1700000000000-a1b2c")`
      );
    }
    return new MemoryId(value);
  }

  equals(other: MemoryId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Timestamp wraps an ISO-8601 date string and provides comparison utilities.
 */
export class Timestamp {
  private constructor(readonly value: string) {}

  static create(isoString: string): Timestamp {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid ISO timestamp: "${isoString}"`);
    }
    return new Timestamp(date.toISOString());
  }

  static now(): Timestamp {
    return new Timestamp(new Date().toISOString());
  }

  isBefore(other: Timestamp): boolean {
    return this.value < other.value;
  }

  isAfter(other: Timestamp): boolean {
    return this.value > other.value;
  }

  equals(other: Timestamp): boolean {
    return this.value === other.value;
  }

  toDate(): Date {
    return new Date(this.value);
  }

  toString(): string {
    return this.value;
  }
}

/**
 * ConfidenceLevel is a type-safe replacement for the "low" | "medium" | "strong" string union,
 * with built-in ordering for comparisons.
 */
export class ConfidenceLevel {
  private static readonly ORDERING: Record<string, number> = {
    low: 0,
    medium: 1,
    strong: 2,
  };

  static readonly LOW = new ConfidenceLevel("low");
  static readonly MEDIUM = new ConfidenceLevel("medium");
  static readonly STRONG = new ConfidenceLevel("strong");

  private constructor(readonly value: "low" | "medium" | "strong") {}

  static create(value: string): ConfidenceLevel {
    switch (value) {
      case "low":
        return ConfidenceLevel.LOW;
      case "medium":
        return ConfidenceLevel.MEDIUM;
      case "strong":
        return ConfidenceLevel.STRONG;
      default:
        throw new Error(
          `Invalid ConfidenceLevel: "${value}". Must be "low", "medium", or "strong".`
        );
    }
  }

  isHigherThan(other: ConfidenceLevel): boolean {
    return (
      ConfidenceLevel.ORDERING[this.value] >
      ConfidenceLevel.ORDERING[other.value]
    );
  }

  isAtLeast(other: ConfidenceLevel): boolean {
    return (
      ConfidenceLevel.ORDERING[this.value] >=
      ConfidenceLevel.ORDERING[other.value]
    );
  }

  equals(other: ConfidenceLevel): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Importance is a type-safe replacement for the "low" | "medium" | "high" string union,
 * with built-in ordering for comparisons.
 */
export class Importance {
  private static readonly ORDERING: Record<string, number> = {
    low: 0,
    medium: 1,
    high: 2,
  };

  static readonly LOW = new Importance("low");
  static readonly MEDIUM = new Importance("medium");
  static readonly HIGH = new Importance("high");

  private constructor(readonly value: "low" | "medium" | "high") {}

  static create(value: string): Importance {
    switch (value) {
      case "low":
        return Importance.LOW;
      case "medium":
        return Importance.MEDIUM;
      case "high":
        return Importance.HIGH;
      default:
        throw new Error(
          `Invalid Importance: "${value}". Must be "low", "medium", or "high".`
        );
    }
  }

  isHigherThan(other: Importance): boolean {
    return (
      Importance.ORDERING[this.value] > Importance.ORDERING[other.value]
    );
  }

  isAtLeast(other: Importance): boolean {
    return (
      Importance.ORDERING[this.value] >= Importance.ORDERING[other.value]
    );
  }

  equals(other: Importance): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Tag wraps a validated non-empty, trimmed string used for categorization.
 */
export class Tag {
  private constructor(readonly value: string) {}

  static create(value: string): Tag {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("Tag cannot be empty.");
    }
    return new Tag(trimmed);
  }

  equals(other: Tag): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Sector represents the business sector of a company.
 * Validates against a predefined set of supported sectors.
 */
export class Sector {
  private static readonly VALID_SECTORS = [
    "saas",
    "ecommerce",
    "agency",
    "startup",
    "b2c",
    "other",
  ] as const;

  static readonly SAAS = new Sector("saas");
  static readonly ECOMMERCE = new Sector("ecommerce");
  static readonly AGENCY = new Sector("agency");
  static readonly STARTUP = new Sector("startup");
  static readonly B2C = new Sector("b2c");
  static readonly OTHER = new Sector("other");

  private constructor(readonly value: string) {}

  static create(value: string): Sector {
    const normalized = value.toLowerCase().trim();
    if (!Sector.VALID_SECTORS.includes(normalized as any)) {
      throw new Error(
        `Invalid sector: "${value}". Valid sectors: ${Sector.VALID_SECTORS.join(", ")}`
      );
    }
    return new Sector(normalized);
  }

  equals(other: Sector): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * BrandTone represents the communication tone of a brand.
 * Accepts predefined tones and custom values for flexibility.
 */
export class BrandTone {
  private static readonly COMMON_TONES = [
    "professional",
    "casual",
    "bold",
    "friendly",
    "authoritative",
    "playful",
  ] as const;

  private constructor(readonly value: string) {}

  static create(value: string): BrandTone {
    const normalized = value.toLowerCase().trim();
    if (!normalized) {
      throw new Error("Brand tone cannot be empty");
    }
    return new BrandTone(normalized);
  }

  equals(other: BrandTone): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * TargetAudience represents the target audience description for a company.
 * Validates that the value is not empty.
 */
export class TargetAudience {
  private constructor(readonly value: string) {}

  static create(value: string): TargetAudience {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error("Target audience cannot be empty");
    }
    return new TargetAudience(trimmed);
  }

  equals(other: TargetAudience): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * EpisodeType represents the type of an episodic memory entry.
 * Validates against predefined episode types.
 */
export class EpisodeType {
  private static readonly VALID_TYPES = [
    "interaction",
    "task_result",
    "feedback",
    "discovery",
  ] as const;

  static readonly INTERACTION = new EpisodeType("interaction");
  static readonly TASK_RESULT = new EpisodeType("task_result");
  static readonly FEEDBACK = new EpisodeType("feedback");
  static readonly DISCOVERY = new EpisodeType("discovery");

  private constructor(readonly value: string) {}

  static create(value: string): EpisodeType {
    const normalized = value.toLowerCase().trim();
    if (!EpisodeType.VALID_TYPES.includes(normalized as any)) {
      throw new Error(
        `Invalid episode type: "${value}". Valid types: ${EpisodeType.VALID_TYPES.join(", ")}`
      );
    }
    return new EpisodeType(normalized);
  }

  equals(other: EpisodeType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
