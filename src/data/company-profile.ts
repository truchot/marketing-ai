import { CompanyProfile } from "@/types";
import { IdGenerator } from "@/lib/id-generator";

let companyProfile: CompanyProfile | null = null;

export function getCompanyProfile(): CompanyProfile | null {
  return companyProfile;
}

export function setCompanyProfile(
  data: Omit<CompanyProfile, "id" | "createdAt" | "updatedAt">
): CompanyProfile {
  const now = IdGenerator.timestamp();
  if (companyProfile) {
    companyProfile = { ...companyProfile, ...data, updatedAt: now };
  } else {
    companyProfile = {
      id: IdGenerator.generate("company"),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
  }
  return companyProfile;
}

export function resetCompanyProfile(): void {
  companyProfile = null;
}
