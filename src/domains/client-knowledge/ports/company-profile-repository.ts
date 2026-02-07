import type { CompanyProfile } from "@/types";

export interface ICompanyProfileRepository {
  get(): CompanyProfile | null;
  save(
    data: Omit<CompanyProfile, "id" | "createdAt" | "updatedAt">
  ): CompanyProfile;
  reset(): void; // For testing
}
