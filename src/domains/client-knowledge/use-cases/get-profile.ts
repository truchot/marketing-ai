import type { ICompanyProfileRepository } from "../ports";
import type { CompanyProfile } from "@/types";
import { Result, ValidationError } from "@/domains/shared";

export class GetProfileUseCase {
  constructor(private profileRepo: ICompanyProfileRepository) {}

  execute(): Result<CompanyProfile | null> {
    try {
      const profile = this.profileRepo.get();
      return Result.ok(profile);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown error"
      ));
    }
  }
}
