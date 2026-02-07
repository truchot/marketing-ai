import type { ICompanyProfileRepository } from "../ports";
import type { CompanyProfile } from "@/types";
import { CompanyProfileAggregate } from "../aggregates";
import { domainEventBus, Result, ValidationError } from "@/domains/shared";

interface CreateProfileInput {
  name: string;
  sector: string;
  description: string;
  target: string;
  brandTone: string;
}

export class CreateProfileUseCase {
  constructor(private profileRepo: ICompanyProfileRepository) {}

  execute(input: CreateProfileInput): Result<CompanyProfile> {
    try {
      // Create rich aggregate - validates invariants
      const aggregate = CompanyProfileAggregate.create({
        name: input.name,
        sector: input.sector,
        description: input.description,
        target: input.target,
        brandTone: input.brandTone,
      });

      // Publish domain events if any
      const events = aggregate.getUncommittedEvents();
      events.forEach(event => domainEventBus.publish(event));
      aggregate.clearUncommittedEvents();

      // Persist via repository using DTO (without id, createdAt, updatedAt)
      const profile = this.profileRepo.save({
        name: aggregate.name,
        sector: aggregate.sector,
        description: aggregate.description,
        target: aggregate.target,
        brandTone: aggregate.brandTone,
        discoveryId: aggregate.discoveryId,
      });

      return Result.ok(profile);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown validation error"
      ));
    }
  }
}
