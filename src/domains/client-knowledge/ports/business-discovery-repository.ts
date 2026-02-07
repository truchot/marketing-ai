import type { BusinessDiscovery } from "@/types/business-discovery";

export interface IBusinessDiscoveryRepository {
  save(discovery: BusinessDiscovery): string; // returns discoveryId
  get(discoveryId: string): BusinessDiscovery | null;
  getLatest(): BusinessDiscovery | null;
  reset(): void; // For testing
}
