import type { ICompanyProfileRepository } from "@/domains/client-knowledge/ports";
import type { CompanyProfile } from "@/types";

let companyProfile: CompanyProfile | null = null;

export class InMemoryCompanyProfileRepository
  implements ICompanyProfileRepository
{
  get(): CompanyProfile | null {
    return companyProfile;
  }

  save(profile: CompanyProfile): CompanyProfile {
    companyProfile = profile;
    return companyProfile;
  }

  reset(): void {
    companyProfile = null;
  }
}

export const companyProfileRepository = new InMemoryCompanyProfileRepository();
