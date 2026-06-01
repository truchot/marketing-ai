import type { ICompanyProfileRepository } from "@/domains/client-knowledge/ports";
import type { CompanyProfile } from "@/types";

/**
 * Standalone in-memory company profile repository for tests.
 * Each instance has its own isolated state (no shared globals).
 */
export class FakeCompanyProfileRepository implements ICompanyProfileRepository {
  private profile: CompanyProfile | null = null;

  get(): CompanyProfile | null {
    return this.profile;
  }

  save(profile: CompanyProfile): CompanyProfile {
    this.profile = profile;
    return this.profile;
  }

  reset(): void {
    this.profile = null;
  }
}
