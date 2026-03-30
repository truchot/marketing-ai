// ============================================================
// Tool 12: saveStrategy — delegates to SaveStrategyUseCase
// Strategy facts are memorized via the STRATEGY_GENERATED
// event handler (see infrastructure/event-handlers.ts).
// ============================================================

import { saveStrategyUseCase } from "@/infrastructure/composition-root";
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
  const taskCount = strategy.operational.tasks.length;
  const campaignCount = strategy.tactical.marketingPlan.campaigns.length;

  return {
    success: true,
    message: `Stratégie sauvegardée : ${strategy.strategic.okrs.length} OKR, ${campaignCount} campagne(s), ${taskCount} tâche(s) opérationnelle(s).`,
    strategyId,
  };
}
