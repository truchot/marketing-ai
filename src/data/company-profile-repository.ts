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

// Shared via globalThis so all Next dev route bundles see the same profile
// (see business-discovery-repository for the rationale).
const globalForProfile = globalThis as unknown as {
  __companyProfileRepository?: InMemoryCompanyProfileRepository;
};
export const companyProfileRepository =
  globalForProfile.__companyProfileRepository ??
  (globalForProfile.__companyProfileRepository =
    new InMemoryCompanyProfileRepository());
