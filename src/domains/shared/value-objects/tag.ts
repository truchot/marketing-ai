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
