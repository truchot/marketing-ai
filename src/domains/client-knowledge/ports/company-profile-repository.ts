import type { CompanyProfile } from "@/types";

export interface ICompanyProfileRepository {
  get(): Promise<CompanyProfile | null>;
  save(profile: CompanyProfile): Promise<CompanyProfile>;
  reset(): Promise<void>; // For testing
}
