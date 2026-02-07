import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AddClientFactUseCase } from "@/domains/memory/use-cases/add-client-fact";
import { SemanticMemoryStore } from "../fakes";
import { domainEventBus, CLIENT_FACT_ADDED } from "@/domains/shared";
import type { DomainEvent } from "@/domains/shared";

describe("AddClientFactUseCase", () => {
  beforeEach(() => {
    domainEventBus.clear();
  });

  afterEach(() => {
    domainEventBus.clear();
  });

  function setup() {
    const semanticRepo = new SemanticMemoryStore();
    const useCase = new AddClientFactUseCase(semanticRepo);
    return { semanticRepo, useCase };
  }

  it("should add a client fact to semantic memory", () => {
    const { semanticRepo, useCase } = setup();

    const result = useCase.execute({
      category: "business",
      fact: "Client operates in the SaaS B2B market",
      source: "onboarding",
    });

    expect(result.isOk()).toBe(true);
    const fact = result.value;
    expect(fact.id).toBeDefined();
    expect(fact.category).toBe("business");
    expect(fact.fact).toBe("Client operates in the SaaS B2B market");
    expect(fact.source).toBe("onboarding");
    expect(fact.addedAt).toBeDefined();

    // Verify persisted in repository
    const facts = semanticRepo.getClientFacts();
    expect(facts).toHaveLength(1);
    expect(facts[0].id).toBe(fact.id);
  });

  it("should publish a CLIENT_FACT_ADDED domain event", () => {
    const { useCase } = setup();

    const publishedEvents: DomainEvent[] = [];
    domainEventBus.subscribe(CLIENT_FACT_ADDED, (event) => {
      publishedEvents.push(event);
    });

    const result = useCase.execute({
      category: "audience",
      fact: "Target audience is marketing directors in mid-size companies",
      source: "conversation",
    });

    expect(result.isOk()).toBe(true);
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0].type).toBe(CLIENT_FACT_ADDED);
    expect(publishedEvents[0].payload).toEqual({
      factId: result.value.id,
      category: "audience",
    });
    expect(publishedEvents[0].occurredAt).toBeDefined();
  });

  it("should store multiple facts independently", () => {
    const { semanticRepo, useCase } = setup();

    const result1 = useCase.execute({
      category: "business",
      fact: "Revenue is 5M ARR",
      source: "onboarding",
    });

    const result2 = useCase.execute({
      category: "audience",
      fact: "Primary audience is CTOs",
      source: "conversation",
    });

    expect(result1.isOk()).toBe(true);
    expect(result2.isOk()).toBe(true);

    const allFacts = semanticRepo.getClientFacts();
    expect(allFacts).toHaveLength(2);
    expect(allFacts[0].id).toBe(result1.value.id);
    expect(allFacts[1].id).toBe(result2.value.id);
  });
});
