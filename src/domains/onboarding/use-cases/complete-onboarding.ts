import type { ICompanyProfileRepository } from "@/domains/client-knowledge/ports";
import type { IBusinessDiscoveryRepository } from "@/domains/client-knowledge/ports";
import type { IMemoryFacade } from "@/domains/onboarding/ports/memory-facade";
import type { IConversationRepository } from "@/domains/conversation/ports";
import type { CompanyProfile } from "@/types";
import type { BusinessDiscovery } from "@/types/business-discovery";
import { CompanyProfileAggregate } from "@/domains/client-knowledge/aggregates";
import { domainEventBus, ONBOARDING_COMPLETED, executeUseCase } from "@/domains/shared";

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
  ) {
    return executeUseCase(async () => {
      const discoveryId = await this.storeDiscovery(discovery);
      const profile = await this.createProfile(discovery, discoveryId);
      await this.memoryFacade.storeDiscoveryFacts(discovery);
      await this.saveConversationHistory(messages);
      this.publishCompletionEvent(profile, discovery, discoveryId);
      return profile;
    });
  }

  private storeDiscovery(discovery: BusinessDiscovery): Promise<string> {
    return this.discoveryRepo.save(discovery);
  }

  private async createProfile(
    discovery: BusinessDiscovery,
    discoveryId: string
  ): Promise<CompanyProfile> {
    const aggregate = CompanyProfileAggregate.create({
      name: discovery.metadata.companyName,
      sector: discovery.metadata.sector,
      description: discovery.problem.statement,
      target: discovery.audiences[0]?.segment ?? "Non défini",
      brandTone: "professionnel",
    });
    aggregate.linkDiscovery(discoveryId);
    aggregate.publishEvents();
    return this.profileRepo.save(aggregate.toDTO());
  }

  private async saveConversationHistory(
    messages: { role: "user" | "assistant"; content: string }[]
  ): Promise<void> {
    await this.conversationRepo.addBulk(messages);
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
