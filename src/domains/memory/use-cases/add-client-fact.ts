import type { ISemanticMemoryRepository } from "../ports";
import type { ClientFact } from "@/types/memory";
import { domainEventBus, CLIENT_FACT_ADDED } from "@/domains/shared";

interface AddClientFactInput {
  category: string;
  fact: string;
  source: string;
}

export class AddClientFactUseCase {
  constructor(private semanticRepo: ISemanticMemoryRepository) {}

  execute(input: AddClientFactInput): ClientFact {
    const fact = this.semanticRepo.addClientFact(
      input.category,
      input.fact,
      input.source
    );
    domainEventBus.publish({
      type: CLIENT_FACT_ADDED,
      occurredAt: new Date().toISOString(),
      payload: { factId: fact.id, category: input.category },
    });
    return fact;
  }
}
