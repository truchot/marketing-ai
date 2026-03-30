// ============================================================
// Test Helper - Reset All Global State
// Call resetAllState() in beforeEach() to guarantee test isolation.
// This file should ONLY be imported from test files.
// ============================================================

import { companyProfileRepository } from "@/data/company-profile-repository";
import { resetConversations } from "@/data/conversations";
import {
  episodicMemory,
  semanticMemory,
  workingMemory,
} from "@/data/memory";
import { businessDiscoveryRepository } from "@/data/business-discovery-repository";
import { domainEventBus } from "@/domains/shared/domain-events";

export function resetAllState(): void {
  // Data stores
  companyProfileRepository.reset();
  resetConversations();

  // Memory stores
  episodicMemory.reset();
  semanticMemory.reset();
  workingMemory.reset();

  // Business discovery
  businessDiscoveryRepository.reset();

  // Domain event bus
  domainEventBus.clear();
}
