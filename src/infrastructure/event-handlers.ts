// ============================================================
// Event Handlers Registration
// Subscribes domain event handlers to the event bus.
// Called once at application startup from composition-root.
// ============================================================

import {
  domainEventBus,
  STRATEGY_GENERATED,
} from "@/domains/shared";
import type { IStrategyRepository } from "@/domains/strategy/ports";
import { StrategyMemorizationService } from "@/domains/strategy/services/strategy-memorization";
import type { ISemanticMemoryRepository } from "@/domains/memory/ports";

export function registerEventHandlers(deps: {
  strategyRepo: IStrategyRepository;
  semanticRepo: ISemanticMemoryRepository;
}): void {
  const memorizationService = new StrategyMemorizationService(deps.semanticRepo);

  domainEventBus.subscribe(STRATEGY_GENERATED, (event) => {
    if (event.type !== STRATEGY_GENERATED) return;

    const strategy = deps.strategyRepo.getLatest();
    if (!strategy) return;

    memorizationService.memorize(strategy);
  });
}
