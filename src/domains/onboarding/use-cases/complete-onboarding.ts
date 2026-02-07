import type { ICompanyProfileRepository } from "@/domains/client-knowledge/ports";
import type { IBusinessDiscoveryRepository } from "@/domains/client-knowledge/ports";
import type { ISemanticMemoryRepository } from "@/domains/memory/ports";
import type { IConversationRepository } from "@/domains/conversation/ports";
import type { CompanyProfile } from "@/types";
import type { BusinessDiscovery } from "@/types/business-discovery";
import { domainEventBus, ONBOARDING_COMPLETED } from "@/domains/shared";

export class CompleteOnboardingUseCase {
  constructor(
    private profileRepo: ICompanyProfileRepository,
    private discoveryRepo: IBusinessDiscoveryRepository,
    private semanticRepo: ISemanticMemoryRepository,
    private conversationRepo: IConversationRepository
  ) {}

  execute(
    discovery: BusinessDiscovery,
    messages: { role: "user" | "assistant"; content: string }[]
  ): CompanyProfile {
    // 1. Store the full BusinessDiscovery
    const discoveryId = this.discoveryRepo.save(discovery);

    // 2. Create company profile from discovery metadata
    const profile = this.profileRepo.save({
      name: discovery.metadata.companyName,
      sector: discovery.metadata.sector,
      description: discovery.problem.statement,
      target:
        discovery.audiences[0]?.segment ?? "Non défini",
      brandTone: "professionnel",
      discoveryId,
    });

    // 3. Feed semantic memory with rich data
    const src = "onboarding";

    // Company metadata
    this.semanticRepo.addClientFact(
      "company",
      `Nom: ${discovery.metadata.companyName}`,
      src
    );
    this.semanticRepo.addClientFact(
      "market",
      `Secteur: ${discovery.metadata.sector}`,
      src
    );

    // Problem
    this.semanticRepo.addClientFact(
      "problem",
      `Problème: ${discovery.problem.statement} (niveau: ${discovery.problem.painLevel}, fréquence: ${discovery.problem.frequency})`,
      src
    );
    for (const alt of discovery.problem.currentAlternatives) {
      this.semanticRepo.addClientFact(
        "problem",
        `Alternative actuelle: ${alt.alternative} — Limites: ${alt.limitations}`,
        src
      );
    }

    // Value proposition
    this.semanticRepo.addClientFact(
      "value_proposition",
      `Transformation: ${discovery.valueProposition.transformation.before} → ${discovery.valueProposition.transformation.after} (délai: ${discovery.valueProposition.transformation.timeToValue})`,
      src
    );
    this.semanticRepo.addClientFact(
      "differentiator",
      `Différenciateur: ${discovery.valueProposition.uniqueDifferentiator}`,
      src
    );
    for (const proof of discovery.valueProposition.proofPoints) {
      this.semanticRepo.addClientFact(
        "value_proposition",
        `Preuve (${proof.type}): ${proof.description}${proof.verified ? " [vérifié]" : " [non vérifié]"}`,
        src
      );
    }

    // Audiences
    for (const audience of discovery.audiences) {
      this.semanticRepo.addClientFact(
        "audience",
        `Segment "${audience.segment}" (${audience.priority}): douleur=${audience.painIntensity}, déclencheur="${audience.triggerMoment}", contexte d'achat="${audience.buyingContext}", canaux=[${audience.channels.join(", ")}]`,
        src
      );
      for (const obj of audience.objections) {
        this.semanticRepo.addClientFact(
          "audience",
          `Objection (${audience.segment}): "${obj.objection}" — Réponse: ${obj.currentAnswer ?? "pas encore de réponse"}`,
          src
        );
      }
    }

    // Current marketing
    for (const channel of discovery.currentMarketing.channels) {
      this.semanticRepo.addClientFact(
        "marketing",
        `Canal "${channel.name}" (${channel.type}): fréquence=${channel.frequency}, résultats=${channel.perceivedResults}${channel.notes ? `, notes: ${channel.notes}` : ""}`,
        src
      );
    }
    if (discovery.currentMarketing.bestPerforming) {
      this.semanticRepo.addClientFact(
        "marketing",
        `Meilleur canal: ${discovery.currentMarketing.bestPerforming}`,
        src
      );
    }
    if (discovery.currentMarketing.biggestGap) {
      this.semanticRepo.addClientFact(
        "marketing",
        `Plus grand manque: ${discovery.currentMarketing.biggestGap}`,
        src
      );
    }
    this.semanticRepo.addClientFact(
      "marketing",
      `Équipe: ${discovery.currentMarketing.team.size} personne(s), dédié marketing=${discovery.currentMarketing.team.dedicatedToMarketing}, compétences=[${discovery.currentMarketing.team.skills.join(", ")}], manques=[${discovery.currentMarketing.team.gaps.join(", ")}]`,
      src
    );
    this.semanticRepo.addClientFact(
      "marketing",
      `Budget: ${discovery.currentMarketing.budget.range}, répartition: ${discovery.currentMarketing.budget.allocation}, flexibilité: ${discovery.currentMarketing.budget.flexibility}`,
      src
    );
    for (const tool of discovery.currentMarketing.tools) {
      this.semanticRepo.addClientFact(
        "marketing",
        `Outil "${tool.name}" (${tool.category}): maturité=${tool.maturity}`,
        src
      );
    }

    // Business context
    this.semanticRepo.addClientFact(
      "business",
      `Phase: ${discovery.businessContext.stage} — ${discovery.businessContext.stageDetails}`,
      src
    );
    this.semanticRepo.addClientFact(
      "business",
      `Objectif principal: ${discovery.businessContext.primaryGoal.description}${discovery.businessContext.primaryGoal.metric ? ` (KPI: ${discovery.businessContext.primaryGoal.metric})` : ""}, horizon: ${discovery.businessContext.primaryGoal.timeline}`,
      src
    );
    for (const constraint of discovery.businessContext.constraints) {
      this.semanticRepo.addClientFact(
        "business",
        `Contrainte (${constraint.type}, ${constraint.severity}): ${constraint.description}`,
        src
      );
    }
    this.semanticRepo.addClientFact(
      "business",
      `Urgence: ${discovery.businessContext.urgency}`,
      src
    );

    // Narrative summary
    this.semanticRepo.addClientFact(
      "summary",
      discovery.narrativeSummary,
      src
    );

    // Strategic hypotheses
    for (const hypothesis of discovery.strategicHypotheses) {
      this.semanticRepo.addClientFact("strategy", hypothesis, src);
    }

    // 4. Save conversation messages
    this.conversationRepo.addBulk(messages);

    // 5. Publish domain event
    domainEventBus.publish({
      type: ONBOARDING_COMPLETED,
      occurredAt: new Date().toISOString(),
      payload: {
        profileId: profile.id,
        companyName: discovery.metadata.companyName,
        discoveryId,
      },
    });

    return profile;
  }
}
