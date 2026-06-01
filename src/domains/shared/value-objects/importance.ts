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
