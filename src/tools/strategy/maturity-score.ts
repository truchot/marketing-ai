// ============================================================
// Maturity Score Calculator
// Computes a marketing maturity score (0-100) across 5 dimensions
// ============================================================

import type { BusinessDiscovery } from "@/types/business-discovery";

/** Points per dimension */
const MAX_DIMENSION_SCORE = 20;

/**
 * Calculate marketing maturity score across 5 dimensions (0-20 each).
 * Total range: 0-100.
 */
export function calculateMaturityScore(discovery: BusinessDiscovery): number {
  const channels = calculateChannelScore(discovery);
  const team = calculateTeamScore(discovery);
  const tools = calculateToolScore(discovery);
  const budget = calculateBudgetScore(discovery);
  const strategy = calculateStrategyScore(discovery);

  return channels + team + tools + budget + strategy;
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
  return (hasMetric ? 8 : 0) + (hasTimeline ? 6 : 0) + (hasEvents ? 4 : 2);
}
