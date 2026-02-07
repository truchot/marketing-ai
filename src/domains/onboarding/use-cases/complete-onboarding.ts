import type { ICompanyProfileRepository } from "@/domains/client-knowledge/ports";
import type { IBusinessDiscoveryRepository } from "@/domains/client-knowledge/ports";
import type { IMemoryFacade } from "@/domains/onboarding/ports/memory-facade";
import type { IConversationRepository } from "@/domains/conversation/ports";
import type { CompanyProfile } from "@/types";
import type { BusinessDiscovery } from "@/types/business-discovery";
import { domainEventBus, ONBOARDING_COMPLETED, Result, ValidationError } from "@/domains/shared";

export class CompleteOnboardingUseCase {
  constructor(
    private profileRepo: ICompanyProfileRepository,
    private discoveryRepo: IBusinessDiscoveryRepository,
    private memoryFacade: IMemoryFacade,
    private conversationRepo: IConversationRepository
  ) {}

  execute(
    discovery: BusinessDiscovery,
    messages: { role: "user" | "assistant"; content: string }[]
  ): Result<CompanyProfile> {
    try {
      const discoveryId = this.storeDiscovery(discovery);
      const profile = this.createProfile(discovery, discoveryId);
      this.memoryFacade.storeDiscoveryFacts(discovery);
      this.saveConversationHistory(messages);
      this.publishCompletionEvent(profile, discovery, discoveryId);
      return Result.ok(profile);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown onboarding error"
      ));
    }
  }

  private storeDiscovery(discovery: BusinessDiscovery): string {
    return this.discoveryRepo.save(discovery);
  }

  private createProfile(
    discovery: BusinessDiscovery,
    discoveryId: string
  ): CompanyProfile {
    return this.profileRepo.save({
      name: discovery.metadata.companyName,
      sector: discovery.metadata.sector,
      description: discovery.problem.statement,
      target:
        discovery.audiences[0]?.segment ?? "Non défini",
      brandTone: "professionnel",
      discoveryId,
    });
  }

  private saveConversationHistory(
    messages: { role: "user" | "assistant"; content: string }[]
  ): void {
    this.conversationRepo.addBulk(messages);
  }

  private publishCompletionEvent(
    profile: CompanyProfile,
    discovery: BusinessDiscovery,
    discoveryId: string
  ): void {
    domainEventBus.publish({
      type: ONBOARDING_COMPLETED,
      occurredAt: new Date().toISOString(),
      payload: {
        profileId: profile.id,
        companyName: discovery.metadata.companyName,
        discoveryId,
      },
    });
  }
}
