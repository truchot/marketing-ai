export class BrandTone {
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
