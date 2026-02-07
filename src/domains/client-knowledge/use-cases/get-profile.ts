import type { ICompanyProfileRepository } from "../ports";
import type { CompanyProfile } from "@/types";

export class GetProfileUseCase {
  constructor(private profileRepo: ICompanyProfileRepository) {}

  execute(): CompanyProfile | null {
    return this.profileRepo.get();
  }
}
