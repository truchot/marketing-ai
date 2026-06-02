import { Result, ValidationError } from "@/domains/shared";
import type { IBusinessDiscoveryRepository } from "@/domains/client-knowledge/ports";
import type { ChannelCacReport } from "@/types/marketing-metrics";
import type {
  IChannelMetricsProvider,
  ChannelMetricsQuery,
} from "@/domains/metrics/ports/channel-metrics-provider";
import { buildChannelCacReport } from "@/domains/metrics/services/build-channel-cac-report";

/**
 * Produces the CAC-per-channel report: pulls raw spend/conversions from the
 * configured metrics provider, uses the latest discovery's blended CAC as the
 * benchmark, and computes the rated, sorted report.
 */
export class GetChannelCacUseCase {
  constructor(
    private readonly provider: IChannelMetricsProvider,
    private readonly discoveryRepo: IBusinessDiscoveryRepository
  ) {}

  async execute(
    query?: ChannelMetricsQuery
  ): Promise<Result<ChannelCacReport>> {
    try {
      const discovery = this.discoveryRepo.getLatest();
      const blendedCac = discovery?.unitEconomics?.cac?.value ?? null;

      const metrics = await this.provider.fetchChannelMetrics(query);
      const report = buildChannelCacReport(metrics, blendedCac, this.provider.source, {
        window: this.provider.estimated
          ? "estimé (discovery)"
          : query?.window ?? "30 derniers jours",
        estimated: this.provider.estimated,
      });

      return Result.ok(report);
    } catch (error) {
      return Result.fail(
        new ValidationError(
          error instanceof Error ? error.message : "Unknown metrics error"
        )
      );
    }
  }
}
