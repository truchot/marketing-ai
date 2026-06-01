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
