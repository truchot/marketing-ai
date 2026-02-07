import type { ICompanyProfileRepository } from "@/domains/client-knowledge/ports";
import type { ISemanticMemoryRepository } from "@/domains/memory/ports";
import type { IConversationRepository } from "@/domains/conversation/ports";
import type { CompanyProfile } from "@/types";
import { domainEventBus, ONBOARDING_COMPLETED } from "@/domains/shared";

interface OnboardingAnswers {
  name: string;
  sector: string;
  description: string;
  target: string;
  brandTone: string;
}

export class CompleteOnboardingUseCase {
  constructor(
    private profileRepo: ICompanyProfileRepository,
    private semanticRepo: ISemanticMemoryRepository,
    private conversationRepo: IConversationRepository
  ) {}

  execute(
    answers: OnboardingAnswers,
    messages: { role: "user" | "assistant"; content: string }[]
  ): CompanyProfile {
    // 1. Create company profile
    const profile = this.profileRepo.save(answers);

    // 2. Feed semantic memory
    this.semanticRepo.addClientFact(
      "company",
      `Nom: ${answers.name}`,
      "onboarding"
    );
    this.semanticRepo.addClientFact(
      "market",
      `Secteur: ${answers.sector}`,
      "onboarding"
    );
    this.semanticRepo.addClientFact(
      "company",
      `Description: ${answers.description}`,
      "onboarding"
    );
    this.semanticRepo.addClientFact(
      "audience",
      `Cible: ${answers.target}`,
      "onboarding"
    );
    this.semanticRepo.addPreference(
      "tone",
      "Ton de marque",
      answers.brandTone,
      "strong"
    );

    // 3. Save conversation messages
    this.conversationRepo.addBulk(messages);

    // 4. Publish domain event
    domainEventBus.publish({
      type: ONBOARDING_COMPLETED,
      occurredAt: new Date().toISOString(),
      payload: { profileId: profile.id, companyName: answers.name },
    });

    return profile;
  }
}
