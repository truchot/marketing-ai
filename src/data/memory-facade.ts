import type { IMemoryFacade } from "@/domains/onboarding/ports/memory-facade";
import type { ISemanticMemoryRepository } from "@/domains/memory/ports";
import type { BusinessDiscovery } from "@/types/business-discovery";

type Fact = { category: string; fact: string };

/**
 * Anti-Corruption Layer : traduit BusinessDiscovery (contexte Onboarding)
 * en ClientFacts sémantiques (contexte Memory).
 *
 * C'est le SEUL point de traduction entre les deux contextes.
 */
export class MemoryFacade implements IMemoryFacade {
  constructor(private readonly semanticRepo: ISemanticMemoryRepository) {}

  async storeDiscoveryFacts(discovery: BusinessDiscovery): Promise<void> {
    const facts: Fact[] = [
      ...this.companyMetadata(discovery),
      ...this.problemContext(discovery),
      ...this.valueProposition(discovery),
      ...this.audiences(discovery),
      ...this.marketing(discovery),
      ...this.businessContext(discovery),
      ...this.summary(discovery),
      ...this.strategicHypotheses(discovery),
    ];
    for (const f of facts) {
      await this.semanticRepo.addClientFact(f.category, f.fact, "onboarding");
    }
  }

  private companyMetadata(discovery: BusinessDiscovery): Fact[] {
    return [
      { category: "company", fact: `Nom: ${discovery.metadata.companyName}` },
      { category: "market", fact: `Secteur: ${discovery.metadata.sector}` },
    ];
  }

  private problemContext(discovery: BusinessDiscovery): Fact[] {
    const facts: Fact[] = [
      {
        category: "problem",
        fact: `Problème: ${discovery.problem.statement} (niveau: ${discovery.problem.painLevel}, fréquence: ${discovery.problem.frequency})`,
      },
    ];
    for (const alt of discovery.problem.currentAlternatives) {
      facts.push({
        category: "problem",
        fact: `Alternative actuelle: ${alt.alternative} — Limites: ${alt.limitations}`,
      });
    }
    return facts;
  }

  private valueProposition(discovery: BusinessDiscovery): Fact[] {
    const facts: Fact[] = [
      {
        category: "value_proposition",
        fact: `Transformation: ${discovery.valueProposition.transformation.before} → ${discovery.valueProposition.transformation.after} (délai: ${discovery.valueProposition.transformation.timeToValue})`,
      },
      {
        category: "differentiator",
        fact: `Différenciateur: ${discovery.valueProposition.uniqueDifferentiator}`,
      },
    ];
    for (const proof of discovery.valueProposition.proofPoints) {
      facts.push({
        category: "value_proposition",
        fact: `Preuve (${proof.type}): ${proof.description}${proof.verified ? " [vérifié]" : " [non vérifié]"}`,
      });
    }
    return facts;
  }

  private audiences(discovery: BusinessDiscovery): Fact[] {
    const facts: Fact[] = [];
    for (const audience of discovery.audiences) {
      facts.push({
        category: "audience",
        fact: `Segment "${audience.segment}" (${audience.priority}): douleur=${audience.painIntensity}, déclencheur="${audience.triggerMoment}", contexte d'achat="${audience.buyingContext}", canaux=[${audience.channels.join(", ")}]`,
      });
      for (const obj of audience.objections) {
        facts.push({
          category: "audience",
          fact: `Objection (${audience.segment}): "${obj.objection}" — Réponse: ${obj.currentAnswer ?? "pas encore de réponse"}`,
        });
      }
    }
    return facts;
  }

  private marketing(discovery: BusinessDiscovery): Fact[] {
    const facts: Fact[] = [];
    for (const channel of discovery.currentMarketing.channels) {
      facts.push({
        category: "marketing",
        fact: `Canal "${channel.name}" (${channel.type}): fréquence=${channel.frequency}, résultats=${channel.perceivedResults}${channel.notes ? `, notes: ${channel.notes}` : ""}`,
      });
    }
    if (discovery.currentMarketing.bestPerforming) {
      facts.push({
        category: "marketing",
        fact: `Meilleur canal: ${discovery.currentMarketing.bestPerforming}`,
      });
    }
    if (discovery.currentMarketing.biggestGap) {
      facts.push({
        category: "marketing",
        fact: `Plus grand manque: ${discovery.currentMarketing.biggestGap}`,
      });
    }
    facts.push({
      category: "marketing",
      fact: `Équipe: ${discovery.currentMarketing.team.size} personne(s), dédié marketing=${discovery.currentMarketing.team.dedicatedToMarketing}, compétences=[${discovery.currentMarketing.team.skills.join(", ")}], manques=[${discovery.currentMarketing.team.gaps.join(", ")}]`,
    });
    facts.push({
      category: "marketing",
      fact: `Budget: ${discovery.currentMarketing.budget.range}, répartition: ${discovery.currentMarketing.budget.allocation}, flexibilité: ${discovery.currentMarketing.budget.flexibility}`,
    });
    for (const tool of discovery.currentMarketing.tools) {
      facts.push({
        category: "marketing",
        fact: `Outil "${tool.name}" (${tool.category}): maturité=${tool.maturity}`,
      });
    }
    return facts;
  }

  private businessContext(discovery: BusinessDiscovery): Fact[] {
    const facts: Fact[] = [
      {
        category: "business",
        fact: `Phase: ${discovery.businessContext.stage} — ${discovery.businessContext.stageDetails}`,
      },
      {
        category: "business",
        fact: `Objectif principal: ${discovery.businessContext.primaryGoal.description}${discovery.businessContext.primaryGoal.metric ? ` (KPI: ${discovery.businessContext.primaryGoal.metric})` : ""}, horizon: ${discovery.businessContext.primaryGoal.timeline}`,
      },
    ];
    for (const constraint of discovery.businessContext.constraints) {
      facts.push({
        category: "business",
        fact: `Contrainte (${constraint.type}, ${constraint.severity}): ${constraint.description}`,
      });
    }
    facts.push({
      category: "business",
      fact: `Urgence: ${discovery.businessContext.urgency}`,
    });
    return facts;
  }

  private summary(discovery: BusinessDiscovery): Fact[] {
    return [{ category: "summary", fact: discovery.narrativeSummary }];
  }

  private strategicHypotheses(discovery: BusinessDiscovery): Fact[] {
    return discovery.strategicHypotheses.map((hypothesis) => ({
      category: "strategy",
      fact: hypothesis,
    }));
  }
}
