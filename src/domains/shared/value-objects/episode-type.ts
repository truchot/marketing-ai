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
    if (!(EpisodeType.VALID_TYPES as readonly string[]).includes(normalized)) {
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
