import type { ICompanyProfileRepository } from "../ports";
import { CompanyProfileAggregate } from "../aggregates";
import { executeUseCase } from "@/domains/shared";

interface CreateProfileInput {
  name: string;
  sector: string;
  description: string;
  target: string;
  brandTone: string;
}

export class CreateProfileUseCase {
  constructor(private profileRepo: ICompanyProfileRepository) {}

  execute(input: CreateProfileInput) {
    return executeUseCase(async () => {
      const aggregate = CompanyProfileAggregate.create({
        name: input.name,
        sector: input.sector,
        description: input.description,
        target: input.target,
        brandTone: input.brandTone,
      });
      aggregate.publishEvents();
      return this.profileRepo.save(aggregate.toDTO());
    });
  }
}
