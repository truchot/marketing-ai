import type { ICompanyProfileRepository } from "@/domains/client-knowledge/ports";
import type { CompanyProfile } from "@/types";

/**
 * Standalone in-memory company profile repository for tests.
 * Each instance has its own isolated state (no shared globals).
 */
export class FakeCompanyProfileRepository implements ICompanyProfileRepository {
  private profile: CompanyProfile | null = null;
  private counter = 0;

  async get(): Promise<CompanyProfile | null> {
    return this.profile;
  }

  async save(
    data: Omit<CompanyProfile, "id" | "createdAt" | "updatedAt">
  ): Promise<CompanyProfile> {
    this.counter += 1;
    const now = "2026-01-01T00:00:00.000Z";
    if (this.profile) {
      this.profile = { ...this.profile, ...data, updatedAt: now };
    } else {
      this.profile = {
        id: `company-${this.counter}`,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
    }
    return this.profile;
  }

  async reset(): Promise<void> {
    this.profile = null;
    this.counter = 0;
  }
}
