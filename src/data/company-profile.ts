import { CompanyProfile } from "@/types";

let companyProfile: CompanyProfile | null = null;

export function getCompanyProfile(): CompanyProfile | null {
  return companyProfile;
}

export function setCompanyProfile(
  data: Omit<CompanyProfile, "id" | "createdAt" | "updatedAt">
): CompanyProfile {
  const now = new Date().toISOString();
  if (companyProfile) {
    companyProfile = { ...companyProfile, ...data, updatedAt: now };
  } else {
    companyProfile = {
      id: "1",
      ...data,
      createdAt: now,
      updatedAt: now,
    };
  }
  return companyProfile;
}
