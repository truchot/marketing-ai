// ============================================================
// Strategy Memorization Domain Service
// Extracts key facts from a strategy and stores them in
// semantic memory for future agent context.
// ============================================================

import type { ISemanticMemoryRepository } from "@/domains/memory/ports";
import type { MarketingStrategy } from "@/types/marketing-strategy";

export class StrategyMemorizationService {
  constructor(private semanticRepo: ISemanticMemoryRepository) {}

  memorize(strategy: MarketingStrategy): void {
    const source = "strategy_agent";
    const category = "strategy";

    this.semanticRepo.addClientFact(
      category,
      `Marché cible: ${strategy.strategic.targetMarket.marketDefinition}`,
      source
    );

    this.semanticRepo.addClientFact(
      category,
      `Proposition de valeur: ${strategy.strategic.businessStrategy.valueProposition}`,
      source
    );

    this.semanticRepo.addClientFact(
      category,
      `Message principal: ${strategy.strategic.marketingFoundation.messaging.primaryMessage}`,
      source
    );

    for (const okr of strategy.strategic.okrs) {
      this.semanticRepo.addClientFact(
        category,
        `OKR ${okr.priority}: ${okr.objective}`,
        source
      );

      for (const kr of okr.keyResults) {
        this.semanticRepo.addClientFact(
          category,
          `KR: ${kr.metric} — cible ${kr.target} (${kr.timeline})`,
          source
        );
      }
    }

    for (const campaign of strategy.tactical.marketingPlan.campaigns) {
      this.semanticRepo.addClientFact(
        category,
        `Campagne "${campaign.name}" — segment: ${campaign.targetSegment}, canaux: ${campaign.channels.join(", ")}`,
        source
      );
    }

    for (const process of strategy.tactical.marketingSystem.processes) {
      this.semanticRepo.addClientFact(
        category,
        `Processus marketing: "${process.name}" — fréquence: ${process.frequency}`,
        source
      );
    }

    this.semanticRepo.addClientFact(
      category,
      `Score maturité marketing: ${strategy.strategic.diagnostic.maturityScore}/100`,
      source
    );
  }
}
