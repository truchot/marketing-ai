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

// Cache the instance on globalThis. In Next dev (Turbopack) each API route is
// a separate bundle, so a plain module-level singleton is NOT shared across
// routes — a value written by /api/onboarding/complete would be invisible to
// /api/metrics/*. globalThis is process-wide and survives HMR, so every route
// (and every reload) sees the same store.
const globalForDiscovery = globalThis as unknown as {
  __businessDiscoveryRepository?: InMemoryBusinessDiscoveryRepository;
};
export const businessDiscoveryRepository =
  globalForDiscovery.__businessDiscoveryRepository ??
  (globalForDiscovery.__businessDiscoveryRepository =
    new InMemoryBusinessDiscoveryRepository());
