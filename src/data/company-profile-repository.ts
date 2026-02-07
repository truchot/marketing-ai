import type { ICompanyProfileRepository } from "@/domains/client-knowledge/ports";
import type { CompanyProfile } from "@/types";
import { getCompanyProfile, setCompanyProfile } from "./company-profile";

export class InMemoryCompanyProfileRepository
  implements ICompanyProfileRepository
{
  get(): CompanyProfile | null {
    return getCompanyProfile();
  }

  save(
    data: Omit<CompanyProfile, "id" | "createdAt" | "updatedAt">
  ): CompanyProfile {
    return setCompanyProfile(data);
  }
}

export const companyProfileRepository = new InMemoryCompanyProfileRepository();
