import type { IMemoryFacade } from "@/domains/onboarding/ports/memory-facade";
import type { ISemanticMemoryRepository } from "@/domains/memory/ports";
import type { BusinessDiscovery } from "@/types/business-discovery";

/**
 * Anti-Corruption Layer : traduit BusinessDiscovery (contexte Onboarding)
 * en ClientFacts sémantiques (contexte Memory).
 *
 * C'est le SEUL point de traduction entre les deux contextes.
 */
export class MemoryFacade implements IMemoryFacade {
  constructor(private readonly semanticRepo: ISemanticMemoryRepository) {}

  storeDiscoveryFacts(discovery: BusinessDiscovery): void {
    this.storeCompanyMetadata(discovery);
    this.storeProblemContext(discovery);
    this.storeValueProposition(discovery);
    this.storeAudiences(discovery);
    this.storeMarketing(discovery);
    this.storeBusinessContext(discovery);
    this.storeSummary(discovery);
    this.storeStrategicHypotheses(discovery);
  }

  private storeCompanyMetadata(discovery: BusinessDiscovery): void {
    const src = "onboarding";
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
  }

  private storeProblemContext(discovery: BusinessDiscovery): void {
    const src = "onboarding";
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
  }

  private storeValueProposition(discovery: BusinessDiscovery): void {
    const src = "onboarding";
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
  }

  private storeAudiences(discovery: BusinessDiscovery): void {
    const src = "onboarding";
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
  }

  private storeMarketing(discovery: BusinessDiscovery): void {
    const src = "onboarding";
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
  }

  private storeBusinessContext(discovery: BusinessDiscovery): void {
    const src = "onboarding";
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
  }

  private storeSummary(discovery: BusinessDiscovery): void {
    const src = "onboarding";
    this.semanticRepo.addClientFact(
      "summary",
      discovery.narrativeSummary,
      src
    );
  }

  private storeStrategicHypotheses(discovery: BusinessDiscovery): void {
    const src = "onboarding";
    for (const hypothesis of discovery.strategicHypotheses) {
      this.semanticRepo.addClientFact("strategy", hypothesis, src);
    }
  }
}
