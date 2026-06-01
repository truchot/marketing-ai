import type { ICompanyProfileRepository } from "../ports";
import { executeUseCase } from "@/domains/shared";

export class GetProfileUseCase {
  constructor(private profileRepo: ICompanyProfileRepository) {}

  execute() {
    return executeUseCase(() => this.profileRepo.get());
  }
}
