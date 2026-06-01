// ============================================================
// État de session stratégique, porté par requête via RequestContext.
//
// Les tools strategy sont stateful au sein d'une session :
// generateDiagnostic pose le diagnostic que proposeOKR/proposeActions lisent.
// On passe cet état par RequestContext (créé par requête dans la route) plutôt
// que par un état module-global racy. Voir [[mastra-migration]].
// ============================================================

import type { BusinessDiscovery } from "@/types/business-discovery";
import type { MarketingDiagnostic, OKR } from "@/types/marketing-strategy";

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export interface StrategySessionState {
  discovery: BusinessDiscovery | null;
  diagnostic: MarketingDiagnostic | null;
  validatedOKRs: OKR[];
  strategyComplete: boolean;
  pendingChoices: { question: string; choices: ChoiceOption[] } | null;
}

export const STRATEGY_STATE_KEY = "strategyState";

export function createStrategySessionState(): StrategySessionState {
  return {
    discovery: null,
    diagnostic: null,
    validatedOKRs: [],
    strategyComplete: false,
    pendingChoices: null,
  };
}
