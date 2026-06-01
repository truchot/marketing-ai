import type { CompanyProfile } from "@/types";

export interface ICompanyProfileRepository {
  get(): CompanyProfile | null;
  save(profile: CompanyProfile): CompanyProfile;
  reset(): void; // For testing
}
