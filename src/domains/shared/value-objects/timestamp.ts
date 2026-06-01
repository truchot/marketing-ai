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
