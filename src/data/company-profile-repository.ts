// ============================================================
// PrismaCompanyProfileRepository
// Single current profile (latest by seq). save() upserts the full
// profile (the caller passes the aggregate DTO, id included).
// ============================================================

import { prisma } from "@/lib/prisma";
import type { ICompanyProfileRepository } from "@/domains/client-knowledge/ports";
import type { CompanyProfile } from "@/types";

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

  async save(profile: CompanyProfile): Promise<CompanyProfile> {
    const data = {
      name: profile.name,
      sector: profile.sector,
      description: profile.description,
      target: profile.target,
      brandTone: profile.brandTone,
      discoveryId: profile.discoveryId ?? null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
    const row = await prisma.companyProfile.upsert({
      where: { id: profile.id },
      create: { id: profile.id, ...data },
      update: data,
    });
    return toDto(row);
  }

  async reset(): Promise<void> {
    await prisma.companyProfile.deleteMany({});
  }
}

export const companyProfileRepository = new PrismaCompanyProfileRepository();
