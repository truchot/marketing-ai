import type { ISemanticMemoryRepository } from "../ports";
import { domainEventBus, CLIENT_FACT_ADDED, executeUseCase } from "@/domains/shared";

interface AddClientFactInput {
  category: string;
  fact: string;
  source: string;
}

export class AddClientFactUseCase {
  constructor(private semanticRepo: ISemanticMemoryRepository) {}

  execute(input: AddClientFactInput) {
    return executeUseCase(async () => {
      const fact = await this.semanticRepo.addClientFact(
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
    });
  }
}
