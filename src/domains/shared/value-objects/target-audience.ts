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
