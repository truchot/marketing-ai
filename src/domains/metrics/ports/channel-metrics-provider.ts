import type {
  ChannelSpendConversions,
  MetricSource,
} from "@/types/marketing-metrics";

export interface ChannelMetricsQuery {
  /** Look-back window, e.g. "30d". Providers may ignore it. */
  window?: string;
}

/**
 * Port for any source of per-channel spend + conversions (GA4, Meta Ads,
 * LinkedIn Ads, HubSpot, manual, or a discovery-derived estimate). The domain
 * depends only on this interface; concrete connectors live in
 * `src/infrastructure/metrics/` and are wired in the composition root.
 */
export interface IChannelMetricsProvider {
  readonly source: MetricSource;
  /** Whether this provider has the credentials/data it needs to run. */
  isConfigured(): boolean;
  /** True when the figures are estimated rather than pulled live. */
  readonly estimated: boolean;
  fetchChannelMetrics(
    query?: ChannelMetricsQuery
  ): Promise<ChannelSpendConversions[]>;
}
