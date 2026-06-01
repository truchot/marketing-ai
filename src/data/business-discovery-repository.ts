// ============================================================
// PrismaBusinessDiscoveryRepository
// The 8-block BusinessDiscovery document is stored as JSONB
// (hybrid normalization — cf. ADR notes / CONTEXT_MAP).
// ============================================================

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { IdGenerator } from "@/lib/id-generator";
import type { IBusinessDiscoveryRepository } from "@/domains/client-knowledge/ports";
import type { BusinessDiscovery } from "@/types/business-discovery";

export class PrismaBusinessDiscoveryRepository implements IBusinessDiscoveryRepository {
  async save(discovery: BusinessDiscovery): Promise<string> {
    const id = IdGenerator.generate("discovery");
    await prisma.businessDiscovery.create({
      data: {
        id,
        companyName: discovery.metadata.companyName,
        data: discovery as unknown as Prisma.InputJsonValue,
      },
    });
    return id;
  }

  async get(discoveryId: string): Promise<BusinessDiscovery | null> {
    const row = await prisma.businessDiscovery.findUnique({ where: { id: discoveryId } });
    return row ? (row.data as unknown as BusinessDiscovery) : null;
  }

  async getLatest(): Promise<BusinessDiscovery | null> {
    const row = await prisma.businessDiscovery.findFirst({ orderBy: { seq: "desc" } });
    return row ? (row.data as unknown as BusinessDiscovery) : null;
  }

  async reset(): Promise<void> {
    await prisma.businessDiscovery.deleteMany({});
  }
}

export const businessDiscoveryRepository = new PrismaBusinessDiscoveryRepository();
