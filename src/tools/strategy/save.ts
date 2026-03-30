// ============================================================
// Tool 12: saveStrategy — delegates to SaveStrategyUseCase
// ============================================================

import {
  addClientFactUseCase,
  saveStrategyUseCase,
} from "@/infrastructure/composition-root";
import type { MarketingStrategy } from "@/types/marketing-strategy";

interface SaveStrategyOutput {
  success: boolean;
  message: string;
  strategyId: string;
}

export async function saveStrategy(
  strategy: MarketingStrategy
): Promise<SaveStrategyOutput> {
  const result = saveStrategyUseCase.execute(strategy);

  if (result.isErr()) {
    return {
      success: false,
      message: result.error.message,
      strategyId: "",
    };
  }

  const strategyId = result.value;

  // Store subsystem facts in semantic memory
  addClientFactUseCase.execute({
    category: "strategy",
    fact: `Marché cible: ${strategy.strategic.targetMarket.marketDefinition}`,
    source: "strategy_agent",
  });

  addClientFactUseCase.execute({
    category: "strategy",
    fact: `Proposition de valeur: ${strategy.strategic.businessStrategy.valueProposition}`,
    source: "strategy_agent",
  });

  addClientFactUseCase.execute({
    category: "strategy",
    fact: `Message principal: ${strategy.strategic.marketingFoundation.messaging.primaryMessage}`,
    source: "strategy_agent",
  });

  for (const okr of strategy.strategic.okrs) {
    addClientFactUseCase.execute({
      category: "strategy",
      fact: `OKR ${okr.priority}: ${okr.objective}`,
      source: "strategy_agent",
    });

    for (const kr of okr.keyResults) {
      addClientFactUseCase.execute({
        category: "strategy",
        fact: `KR: ${kr.metric} — cible ${kr.target} (${kr.timeline})`,
        source: "strategy_agent",
      });
    }
  }

  for (const campaign of strategy.tactical.marketingPlan.campaigns) {
    addClientFactUseCase.execute({
      category: "strategy",
      fact: `Campagne "${campaign.name}" — segment: ${campaign.targetSegment}, canaux: ${campaign.channels.join(", ")}`,
      source: "strategy_agent",
    });
  }

  for (const process of strategy.tactical.marketingSystem.processes) {
    addClientFactUseCase.execute({
      category: "strategy",
      fact: `Processus marketing: "${process.name}" — fréquence: ${process.frequency}`,
      source: "strategy_agent",
    });
  }

  addClientFactUseCase.execute({
    category: "strategy",
    fact: `Score maturité marketing: ${strategy.strategic.diagnostic.maturityScore}/100`,
    source: "strategy_agent",
  });

  const taskCount = strategy.operational.tasks.length;
  const campaignCount = strategy.tactical.marketingPlan.campaigns.length;

  return {
    success: true,
    message: `Stratégie sauvegardée : ${strategy.strategic.okrs.length} OKR, ${campaignCount} campagne(s), ${taskCount} tâche(s) opérationnelle(s).`,
    strategyId,
  };
}
