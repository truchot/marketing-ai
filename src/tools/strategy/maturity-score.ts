// ============================================================
// Maturity Score Calculator
// Computes a marketing maturity score (0-100) across 5 dimensions
// ============================================================

import type { BusinessDiscovery } from "@/types/business-discovery";

/** Points per dimension (6 dimensions × 17 = 102, capped at 100) */
const MAX_DIMENSION_SCORE = 17;

/**
 * Calculate marketing maturity score across 6 dimensions (0-17 each).
 * Total range: 0-100 (capped).
 */
export function calculateMaturityScore(discovery: BusinessDiscovery): number {
  const channels = calculateChannelScore(discovery);
  const team = calculateTeamScore(discovery);
  const tools = calculateToolScore(discovery);
  const budget = calculateBudgetScore(discovery);
  const strategy = calculateStrategyScore(discovery);
  const financial = calculateFinancialScore(discovery);

  return Math.min(100, channels + team + tools + budget + strategy + financial);
}

/** Channels dimension: diversity and performance of active channels */
function calculateChannelScore(discovery: BusinessDiscovery): number {
  const activeChannels = discovery.currentMarketing.channels.length;
  const goodChannels = discovery.currentMarketing.channels.filter(
    (c) => c.perceivedResults === "good"
  ).length;
  return Math.min(MAX_DIMENSION_SCORE, activeChannels * 4 + goodChannels * 4);
}

/** Team dimension: size, dedication, skills vs gaps */
function calculateTeamScore(discovery: BusinessDiscovery): number {
  const { size, dedicatedToMarketing, skills, gaps } = discovery.currentMarketing.team;
  return Math.min(
    MAX_DIMENSION_SCORE,
    (dedicatedToMarketing ? 8 : 3) + Math.min(size * 2, 6) + Math.max(0, (skills.length - gaps.length) * 2)
  );
}

/** Tools dimension: count and maturity of marketing tools */
function calculateToolScore(discovery: BusinessDiscovery): number {
  const tools = discovery.currentMarketing.tools;
  const wellConfigured = tools.filter((t) => t.maturity === "well_configured").length;
  const underused = tools.filter((t) => t.maturity === "underused").length;
  return Math.min(MAX_DIMENSION_SCORE, wellConfigured * 6 + underused * 2 + tools.length);
}

/** Budget dimension: flexibility + range presence */
function calculateBudgetScore(discovery: BusinessDiscovery): number {
  const { flexibility, range, allocation } = discovery.currentMarketing.budget;
  const hasRange = range.length > 0;
  const hasAllocation = allocation.length > 0;
  return (
    (flexibility === "adjustable" ? 12 : flexibility === "fixed" ? 6 : 2) +
    (hasRange ? 4 : 0) +
    (hasAllocation ? 4 : 0)
  );
}

/** Strategy dimension: clarity of goals, KPIs, and upcoming events */
function calculateStrategyScore(discovery: BusinessDiscovery): number {
  const hasMetric = discovery.businessContext.primaryGoal.metric !== null;
  const hasTimeline = discovery.businessContext.primaryGoal.timeline.length > 0;
  const hasEvents = discovery.businessContext.upcomingEvents.length > 0;
  return Math.min(MAX_DIMENSION_SCORE, (hasMetric ? 7 : 0) + (hasTimeline ? 5 : 0) + (hasEvents ? 5 : 2));
}

/** Financial dimension: knowledge of unit economics (CAC, LTV, payback, pipeline) */
function calculateFinancialScore(discovery: BusinessDiscovery): number {
  const ue = discovery.unitEconomics;
  const knowledgeBase = ue.knowledgeLevel === "advanced" ? 5 : ue.knowledgeLevel === "basic" ? 2 : 0;
  const hasCAC = ue.cac.value !== null ? 3 : 0;
  const hasLTV = ue.ltv.value !== null ? 3 : 0;
  const hasPayback = ue.cacPayback.known ? 2 : 0;
  const hasRatio = ue.ltvCacRatio !== null ? 2 : 0;
  const hasPipeline = ue.qualifiedRevenuePipeline.tracked ? 2 : 0;
  return Math.min(MAX_DIMENSION_SCORE, knowledgeBase + hasCAC + hasLTV + hasPayback + hasRatio + hasPipeline);
}
