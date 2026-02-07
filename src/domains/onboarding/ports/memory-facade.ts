import type { BusinessDiscovery } from "@/types/business-discovery";

/**
 * Anti-Corruption Layer : traduit les concepts du contexte Onboarding
 * (BusinessDiscovery) vers le contexte Memory (ClientFacts sémantiques).
 */
export interface IMemoryFacade {
  /**
   * Enrichit la mémoire sémantique avec toutes les données
   * extraites lors de la découverte business.
   */
  storeDiscoveryFacts(discovery: BusinessDiscovery): void;
}
