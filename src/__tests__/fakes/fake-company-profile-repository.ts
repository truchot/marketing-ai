import type { ICompanyProfileRepository } from "@/domains/client-knowledge/ports";
import type { CompanyProfile } from "@/types";

/**
 * Standalone in-memory company profile repository for tests.
 * Each instance has its own isolated state (no shared globals).
 */
export class FakeCompanyProfileRepository implements ICompanyProfileRepository {
  private profile: CompanyProfile | null = null;

  async get(): Promise<CompanyProfile | null> {
    return this.profile;
  }

  async save(profile: CompanyProfile): Promise<CompanyProfile> {
    this.profile = profile;
    return this.profile;
  }

  async reset(): Promise<void> {
    this.profile = null;
  }
}
