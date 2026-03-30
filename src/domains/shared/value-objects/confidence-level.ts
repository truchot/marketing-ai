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
