import type {
  IChannelMetricsProvider,
  ChannelMetricsQuery,
} from "@/domains/metrics/ports/channel-metrics-provider";
import type {
  ChannelSpendConversions,
  MetricSource,
} from "@/types/marketing-metrics";

/**
 * Selects the first configured live connector, otherwise falls back to the
 * estimate provider. This is what lets the dashboard work today (derived data)
 * and switch to real data automatically once a connector's credentials are set.
 */
export class CompositeChannelMetricsProvider
  implements IChannelMetricsProvider
{
  constructor(
    private readonly connectors: IChannelMetricsProvider[],
    private readonly fallback: IChannelMetricsProvider
  ) {}

  private pick(): IChannelMetricsProvider {
    return this.connectors.find((c) => c.isConfigured()) ?? this.fallback;
  }

  get source(): MetricSource {
    return this.pick().source;
  }

  get estimated(): boolean {
    return this.pick().estimated;
  }

  isConfigured(): boolean {
    return true;
  }

  fetchChannelMetrics(
    query?: ChannelMetricsQuery
  ): Promise<ChannelSpendConversions[]> {
    return this.pick().fetchChannelMetrics(query);
  }
}
