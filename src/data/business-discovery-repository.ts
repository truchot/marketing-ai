import type { IBusinessDiscoveryRepository } from "@/domains/client-knowledge/ports";
import type { BusinessDiscovery } from "@/types/business-discovery";
import { IdGenerator } from "@/lib/id-generator";

const store = new Map<string, BusinessDiscovery>();
let latestId: string | null = null;

export class InMemoryBusinessDiscoveryRepository
  implements IBusinessDiscoveryRepository
{
  save(discovery: BusinessDiscovery): string {
    const id = IdGenerator.generate("discovery");
    store.set(id, discovery);
    latestId = id;
    return id;
  }

  get(discoveryId: string): BusinessDiscovery | null {
    return store.get(discoveryId) ?? null;
  }

  getLatest(): BusinessDiscovery | null {
    if (!latestId) return null;
    return store.get(latestId) ?? null;
  }

  reset(): void {
    store.clear();
    latestId = null;
  }
}

export const businessDiscoveryRepository =
  new InMemoryBusinessDiscoveryRepository();
