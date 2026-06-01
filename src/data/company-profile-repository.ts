// ============================================================
// PrismaCompanyProfileRepository
// Single current profile (latest by seq). save() updates the
// existing profile or creates the first one.
// ============================================================

import { prisma } from "@/lib/prisma";
import { IdGenerator } from "@/lib/id-generator";
import type { ICompanyProfileRepository } from "@/domains/client-knowledge/ports";
import type { CompanyProfile } from "@/types";

type ProfileData = Omit<CompanyProfile, "id" | "createdAt" | "updatedAt">;

function toDto(r: {
  id: string;
  name: string;
  sector: string;
  description: string;
  target: string;
  brandTone: string;
  discoveryId: string | null;
  createdAt: string;
  updatedAt: string;
}): CompanyProfile {
  return {
    id: r.id,
    name: r.name,
    sector: r.sector,
    description: r.description,
    target: r.target,
    brandTone: r.brandTone,
    discoveryId: r.discoveryId ?? undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export class PrismaCompanyProfileRepository implements ICompanyProfileRepository {
  async get(): Promise<CompanyProfile | null> {
    const row = await prisma.companyProfile.findFirst({ orderBy: { seq: "desc" } });
    return row ? toDto(row) : null;
  }

  async save(data: ProfileData): Promise<CompanyProfile> {
    const now = IdGenerator.timestamp();
    const existing = await prisma.companyProfile.findFirst({ orderBy: { seq: "desc" } });

    if (existing) {
      const updated = await prisma.companyProfile.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          sector: data.sector,
          description: data.description,
          target: data.target,
          brandTone: data.brandTone,
          discoveryId: data.discoveryId ?? null,
          updatedAt: now,
        },
      });
      return toDto(updated);
    }

    const created = await prisma.companyProfile.create({
      data: {
        id: IdGenerator.generate("company"),
        name: data.name,
        sector: data.sector,
        description: data.description,
        target: data.target,
        brandTone: data.brandTone,
        discoveryId: data.discoveryId ?? null,
        createdAt: now,
        updatedAt: now,
      },
    });
    return toDto(created);
  }

  async reset(): Promise<void> {
    await prisma.companyProfile.deleteMany({});
  }
}

export const companyProfileRepository = new PrismaCompanyProfileRepository();
