import type { IBusinessDiscoveryRepository } from "@/domains/client-knowledge/ports";
import type { IChannelMetricsProvider } from "@/domains/metrics/ports/channel-metrics-provider";
import type {
  ChannelSpendConversions,
  ChannelType,
} from "@/types/marketing-metrics";
import type { BusinessDiscovery } from "@/types/business-discovery";

// Relative spend weight by channel type — paid channels carry real € spend,
// organic channels mostly cost time (approximated with a small weight).
const SPEND_WEIGHT: Record<ChannelType, number> = {
  paid: 1.0,
  partnership: 0.5,
  offline: 0.45,
  referral: 0.3,
  organic: 0.25,
};

// CAC multiplier vs the blended CAC, inferred from the qualitative
// `perceivedResults` captured during discovery.
const PERF_CAC_MULTIPLIER: Record<string, number> = {
  good: 0.6,
  average: 1.0,
  poor: 1.8,
  unknown: 1.2,
};

/** Average of all numbers found in a free-text range, e.g. "3 000 à 5 000 €" → 4000. */
function parseEuroAverage(text: string | undefined): number {
  if (!text) return 0;
  const nums = (text.match(/\d[\d\s.,]*/g) ?? [])
    .map((n) => Number(n.replace(/[\s.,]/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Estimates per-channel spend + conversions from the BusinessDiscovery so the
 * dashboard renders before any live connector is wired. The figures are
 * deliberately approximate (flagged `estimated: true`): spend is the monthly
 * budget split by channel type, conversions back out from the blended CAC
 * scaled by each channel's perceived performance.
 */
export class DiscoveryDerivedMetricsProvider implements IChannelMetricsProvider {
  readonly source = "derived" as const;
  readonly estimated = true;

  constructor(private readonly discoveryRepo: IBusinessDiscoveryRepository) {}

  isConfigured(): boolean {
    return this.discoveryRepo.getLatest() !== null;
  }

  async fetchChannelMetrics(): Promise<ChannelSpendConversions[]> {
    const discovery = this.discoveryRepo.getLatest();
    if (!discovery) return [];
    return this.derive(discovery);
  }

  private derive(d: BusinessDiscovery): ChannelSpendConversions[] {
    const channels = d.currentMarketing?.channels ?? [];
    if (channels.length === 0) return [];

    const monthlyBudget =
      parseEuroAverage(d.currentMarketing?.budget?.range) || 4000;
    const blendedCac = d.unitEconomics?.cac?.value ?? 300;

    const totalWeight = channels.reduce(
      (sum, c) => sum + (SPEND_WEIGHT[c.type] ?? 0.5),
      0
    );

    return channels.map((c) => {
      const weight = SPEND_WEIGHT[c.type] ?? 0.5;
      const spend = totalWeight > 0 ? (monthlyBudget * weight) / totalWeight : 0;
      const channelCac =
        blendedCac * (PERF_CAC_MULTIPLIER[c.perceivedResults] ?? 1.2);
      const newCustomers =
        channelCac > 0 ? Math.max(1, Math.round(spend / channelCac)) : 0;
      return {
        channel: c.name,
        type: c.type,
        spend: Math.round(spend),
        newCustomers,
        source: this.source,
      };
    });
  }
}
