import type { BusinessDiscovery } from "@/types/business-discovery";

export interface IBusinessDiscoveryRepository {
  save(discovery: BusinessDiscovery): Promise<string>; // returns discoveryId
  get(discoveryId: string): Promise<BusinessDiscovery | null>;
  getLatest(): Promise<BusinessDiscovery | null>;
  reset(): Promise<void>; // For testing
}
