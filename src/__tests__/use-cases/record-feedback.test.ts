import { describe, it, expect } from "vitest";
import { RecordFeedbackUseCase } from "@/domains/memory/use-cases/record-feedback";
import { EpisodicMemoryStore } from "../fakes";

describe("RecordFeedbackUseCase", () => {
  function setup() {
    const episodicRepo = new EpisodicMemoryStore();
    const useCase = new RecordFeedbackUseCase(episodicRepo);
    return { episodicRepo, useCase };
  }

  it("should record positive feedback", () => {
    const { episodicRepo, useCase } = setup();

    const result = useCase.execute({
      source: "user",
      sentiment: "positive",
      content: "Great response, very helpful!",
    });

    expect(result.isOk()).toBe(true);
    const feedback = result.value;
    expect(feedback.id).toBeDefined();
    expect(feedback.source).toBe("user");
    expect(feedback.sentiment).toBe("positive");
    expect(feedback.content).toBe("Great response, very helpful!");
    expect(feedback.timestamp).toBeDefined();

    // Verify persisted
    const allFeedback = episodicRepo.getFeedback();
    expect(allFeedback).toHaveLength(1);
    expect(allFeedback[0].id).toBe(feedback.id);
  });

  it("should record negative feedback", () => {
    const { useCase } = setup();

    const result = useCase.execute({
      source: "user",
      sentiment: "negative",
      content: "The suggestion was off-topic.",
    });

    expect(result.isOk()).toBe(true);
    expect(result.value.sentiment).toBe("negative");
    expect(result.value.content).toBe("The suggestion was off-topic.");
  });

  it("should record feedback with a taskId", () => {
    const { useCase } = setup();

    const result = useCase.execute({
      source: "user",
      sentiment: "positive",
      content: "Task completed well",
      taskId: "task-123",
    });

    expect(result.isOk()).toBe(true);
    expect(result.value.taskId).toBe("task-123");
  });

  it("should record neutral feedback", () => {
    const { useCase } = setup();

    const result = useCase.execute({
      source: "system",
      sentiment: "neutral",
      content: "Average performance on the task.",
    });

    expect(result.isOk()).toBe(true);
    expect(result.value.sentiment).toBe("neutral");
    expect(result.value.source).toBe("system");
  });
});
