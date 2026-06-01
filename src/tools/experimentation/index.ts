// ============================================================
// Experimentation Tools — barrel
// SDK-backed market intelligence + asset production for the
// Experimentation context. Mirrors the discovery/strategy tools.
// ============================================================

export {
  analyzeCompetitorAngles,
  toConfidenceSources,
  deriveConfidence,
  buildCompetitorAnglesPrompt,
} from "./competitor-intel";
export type {
  CompetitorIntel,
  MarketAngle,
  AnalyzeCompetitorAnglesInput,
} from "./competitor-intel";

export { generateVariants, buildVariantsPrompt } from "./variants";
export type { GenerateVariantsInput } from "./variants";
