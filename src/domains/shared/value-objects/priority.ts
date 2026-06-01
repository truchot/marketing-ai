export type PriorityValue = "primary" | "secondary";

export class Priority {
  static readonly PRIMARY = new Priority("primary");
  static readonly SECONDARY = new Priority("secondary");

  private constructor(readonly value: PriorityValue) {}

  static create(value: string): Priority {
    switch (value) {
      case "primary":
        return Priority.PRIMARY;
      case "secondary":
        return Priority.SECONDARY;
      default:
        throw new Error(
          `Invalid Priority: "${value}". Must be "primary" or "secondary".`
        );
    }
  }

  isPrimary(): boolean {
    return this.value === "primary";
  }

  equals(other: Priority): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
