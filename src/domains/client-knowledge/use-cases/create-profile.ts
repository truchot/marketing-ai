import type { ICompanyProfileRepository } from "../ports";
import type { CompanyProfile } from "@/types";

interface CreateProfileInput {
  name: string;
  sector: string;
  description: string;
  target: string;
  brandTone: string;
}

export class CreateProfileUseCase {
  constructor(private profileRepo: ICompanyProfileRepository) {}

  execute(input: CreateProfileInput): CompanyProfile {
    return this.profileRepo.save(input);
  }
}
