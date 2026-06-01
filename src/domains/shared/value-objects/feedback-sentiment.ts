export type FeedbackSentimentValue = "positive" | "neutral" | "negative";

export class FeedbackSentiment {
  static readonly POSITIVE = new FeedbackSentiment("positive");
  static readonly NEUTRAL = new FeedbackSentiment("neutral");
  static readonly NEGATIVE = new FeedbackSentiment("negative");

  private constructor(readonly value: FeedbackSentimentValue) {}

  static create(value: string): FeedbackSentiment {
    switch (value) {
      case "positive":
        return FeedbackSentiment.POSITIVE;
      case "neutral":
        return FeedbackSentiment.NEUTRAL;
      case "negative":
        return FeedbackSentiment.NEGATIVE;
      default:
        throw new Error(
          `Invalid FeedbackSentiment: "${value}". Must be "positive", "neutral", or "negative".`
        );
    }
  }

  isPositive(): boolean {
    return this.value === "positive";
  }

  isNegative(): boolean {
    return this.value === "negative";
  }

  equals(other: FeedbackSentiment): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
