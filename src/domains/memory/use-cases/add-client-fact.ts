import type { ISemanticMemoryRepository } from "../ports";
import type { ClientFact } from "@/types/memory";
import { domainEventBus, CLIENT_FACT_ADDED, Result, ValidationError } from "@/domains/shared";

interface AddClientFactInput {
  category: string;
  fact: string;
  source: string;
}

export class AddClientFactUseCase {
  constructor(private semanticRepo: ISemanticMemoryRepository) {}

  execute(input: AddClientFactInput): Result<ClientFact> {
    try {
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
      return Result.ok(fact);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown validation error"
      ));
    }
  }
}
