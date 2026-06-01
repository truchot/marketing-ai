import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SendMessageUseCase } from "@/domains/conversation/use-cases/send-message";
import {
  EpisodicMemoryStore,
  FakeConversationRepository,
  FakeResponseGenerator,
} from "../fakes";
import { domainEventBus, MESSAGE_SENT } from "@/domains/shared";
import type { DomainEvent } from "@/domains/shared";

describe("SendMessageUseCase", () => {
  beforeEach(() => {
    domainEventBus.clear();
  });

  afterEach(() => {
    domainEventBus.clear();
  });

  function setup(responseText = "This is a test response.") {
    const conversationRepo = new FakeConversationRepository();
    const episodicRepo = new EpisodicMemoryStore();
    const responseGenerator = new FakeResponseGenerator();
    responseGenerator.setResponse(responseText);
    const useCase = new SendMessageUseCase(
      conversationRepo,
      episodicRepo,
      responseGenerator
    );
    return { conversationRepo, episodicRepo, responseGenerator, useCase };
  }

  it("should add the user message to the conversation", async () => {
    const { conversationRepo, useCase } = setup();

    const result = await useCase.execute("Hello, I need help with SEO.");

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    const { userMessage } = result.value;
    expect(userMessage.role).toBe("user");
    expect(userMessage.content).toBe("Hello, I need help with SEO.");

    const allMessages = await conversationRepo.getAll();
    expect(allMessages.some((m) => m.id === userMessage.id)).toBe(true);
  });

  it("should generate and add the assistant response", async () => {
    const { conversationRepo, useCase } = setup("Sure, I can help with SEO!");

    const result = await useCase.execute("Help me with SEO");

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    const { assistantMessage } = result.value;
    expect(assistantMessage.role).toBe("assistant");
    expect(assistantMessage.content).toBe("Sure, I can help with SEO!");

    const allMessages = await conversationRepo.getAll();
    expect(allMessages.some((m) => m.id === assistantMessage.id)).toBe(true);
  });

  it("should record the interaction in episodic memory", async () => {
    const { episodicRepo, useCase } = setup();

    const result = await useCase.execute("What is content marketing?");

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    const { userMessage } = result.value;

    const episodes = await episodicRepo.getEpisodes();
    expect(episodes).toHaveLength(1);
    expect(episodes[0].type).toBe("interaction");
    expect(episodes[0].description).toBe("What is content marketing?");
    expect(episodes[0].data).toEqual({
      messageId: userMessage.id,
      role: "user",
    });
    expect(episodes[0].metadata.tags).toEqual(["conversation", "user_message"]);
    expect(episodes[0].metadata.importance).toBe("medium");
  });

  it("should publish a MESSAGE_SENT domain event", async () => {
    const { useCase } = setup();

    const publishedEvents: DomainEvent[] = [];
    domainEventBus.subscribe(MESSAGE_SENT, (event) => {
      publishedEvents.push(event);
    });

    const result = await useCase.execute("Test message");

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    const { userMessage, assistantMessage } = result.value;

    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0].type).toBe(MESSAGE_SENT);
    expect(publishedEvents[0].payload).toEqual({
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
    });
    expect(publishedEvents[0].occurredAt).toBeDefined();
  });

  it("should return both user and assistant messages", async () => {
    const { useCase } = setup();

    const result = await useCase.execute("Hello");

    expect(result.isOk()).toBe(true);
    if (!result.isOk()) return;
    expect(result.value.userMessage).toBeDefined();
    expect(result.value.assistantMessage).toBeDefined();
    expect(result.value.userMessage.role).toBe("user");
    expect(result.value.assistantMessage.role).toBe("assistant");
  });
});
