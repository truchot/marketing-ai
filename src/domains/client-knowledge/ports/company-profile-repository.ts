import type { CompanyProfile } from "@/types";

export interface ICompanyProfileRepository {
  get(): Promise<CompanyProfile | null>;
  save(
    data: Omit<CompanyProfile, "id" | "createdAt" | "updatedAt">
  ): Promise<CompanyProfile>;
  reset(): Promise<void>; // For testing
}
