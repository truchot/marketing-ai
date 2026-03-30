// ============================================================
// Strategy Tools — Barrel re-exports
// Split into domain-specific modules for maintainability:
//   maturity-score.ts    — Maturity score calculator (5 dimensions)
//   diagnostic.ts        — Tool 1: SWOT + maturity diagnostic
//   strategic-subsystems/ — Tools 2-5: Target Market, Business Strategy,
//                           Marketing Foundation, Feedback Loop
//   okrs.ts              — Tools 6 & 11: OKR proposal and adjustment
//   roadmap-validation.ts — Tool 7: Gate Strategy → Tactics
//   tactical.ts          — Tools 8-9: Marketing Plan, Marketing System
//   operational.ts       — Tool 10: Tasks, Calendar, Weekly KPIs
//   save.ts              — Tool 12: Persist strategy via use case
// ============================================================

export { calculateMaturityScore } from "./maturity-score";
export { generateDiagnostic } from "./diagnostic";
export {
  analyzeTargetMarket,
  defineBusinessStrategy,
  defineMarketingFoundation,
  defineFeedbackLoop,
} from "./strategic-subsystems";
export { proposeOKRs, adjustOKR } from "./okrs";
export { validateRoadmap } from "./roadmap-validation";
export { proposeMarketingPlan, proposeMarketingSystem } from "./tactical";
export { proposeTasks } from "./operational";
export { saveStrategy } from "./save";
