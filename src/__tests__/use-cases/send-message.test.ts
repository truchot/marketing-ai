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
    const responseGenerator = new FakeResponseGenerator(responseText);
    const useCase = new SendMessageUseCase(
      conversationRepo,
      episodicRepo,
      responseGenerator
    );
    return { conversationRepo, episodicRepo, responseGenerator, useCase };
  }

  it("should add the user message to the conversation", () => {
    const { conversationRepo, useCase } = setup();

    const result = useCase.execute("Hello, I need help with SEO.");

    expect(result.isOk()).toBe(true);
    const { userMessage } = result.value;
    expect(userMessage.role).toBe("user");
    expect(userMessage.content).toBe("Hello, I need help with SEO.");

    const allMessages = conversationRepo.getAll();
    expect(allMessages.some((m) => m.id === userMessage.id)).toBe(true);
  });

  it("should generate and add the assistant response", () => {
    const { conversationRepo, useCase } = setup("Sure, I can help with SEO!");

    const result = useCase.execute("Help me with SEO");

    expect(result.isOk()).toBe(true);
    const { assistantMessage } = result.value;
    expect(assistantMessage.role).toBe("assistant");
    expect(assistantMessage.content).toBe("Sure, I can help with SEO!");

    const allMessages = conversationRepo.getAll();
    expect(allMessages.some((m) => m.id === assistantMessage.id)).toBe(true);
  });

  it("should record the interaction in episodic memory", () => {
    const { episodicRepo, useCase } = setup();

    const result = useCase.execute("What is content marketing?");

    expect(result.isOk()).toBe(true);
    const { userMessage } = result.value;

    const episodes = episodicRepo.getEpisodes();
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

  it("should publish a MESSAGE_SENT domain event", () => {
    const { useCase } = setup();

    const publishedEvents: DomainEvent[] = [];
    domainEventBus.subscribe(MESSAGE_SENT, (event) => {
      publishedEvents.push(event);
    });

    const result = useCase.execute("Test message");

    expect(result.isOk()).toBe(true);
    const { userMessage, assistantMessage } = result.value;

    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0].type).toBe(MESSAGE_SENT);
    expect(publishedEvents[0].payload).toEqual({
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
    });
    expect(publishedEvents[0].occurredAt).toBeDefined();
  });

  it("should return both user and assistant messages", () => {
    const { useCase } = setup();

    const result = useCase.execute("Hello");

    expect(result.isOk()).toBe(true);
    expect(result.value.userMessage).toBeDefined();
    expect(result.value.assistantMessage).toBeDefined();
    expect(result.value.userMessage.role).toBe("user");
    expect(result.value.assistantMessage.role).toBe("assistant");
  });
});
