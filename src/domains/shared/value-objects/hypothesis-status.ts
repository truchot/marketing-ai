export type HypothesisStatusValue = "untested" | "validated" | "invalidated" | "needs_more_data";

export class HypothesisStatus {
  static readonly UNTESTED = new HypothesisStatus("untested");
  static readonly VALIDATED = new HypothesisStatus("validated");
  static readonly INVALIDATED = new HypothesisStatus("invalidated");
  static readonly NEEDS_MORE_DATA = new HypothesisStatus("needs_more_data");

  private constructor(readonly value: HypothesisStatusValue) {}

  static create(value: string): HypothesisStatus {
    switch (value) {
      case "untested":
        return HypothesisStatus.UNTESTED;
      case "validated":
        return HypothesisStatus.VALIDATED;
      case "invalidated":
        return HypothesisStatus.INVALIDATED;
      case "needs_more_data":
        return HypothesisStatus.NEEDS_MORE_DATA;
      default:
        throw new Error(
          `Invalid HypothesisStatus: "${value}". Must be "untested", "validated", "invalidated", or "needs_more_data".`
        );
    }
  }

  isResolved(): boolean {
    return this.value === "validated" || this.value === "invalidated";
  }

  equals(other: HypothesisStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
