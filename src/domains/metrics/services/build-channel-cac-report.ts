import type {
  ChannelCacRow,
  ChannelCacReport,
  ChannelSpendConversions,
  CacRating,
  MetricSource,
} from "@/types/marketing-metrics";

// CAC efficiency thresholds, expressed as a multiple of the blended CAC.
const EFFICIENT_MAX = 1.0; // at or below blended → efficient
const WATCH_MAX = 1.5; // up to 1.5× blended → watch; above → critical

function rate(cac: number | null, blended: number | null): CacRating {
  if (cac === null) return "unknown";
  if (blended === null || blended <= 0) return "unknown";
  const ratio = cac / blended;
  if (ratio <= EFFICIENT_MAX) return "efficient";
  if (ratio <= WATCH_MAX) return "watch";
  return "critical";
}

/**
 * Pure transform: raw per-channel spend/conversions → a sorted, rated CAC
 * report. Channels are sorted by CAC ascending (most efficient first); rows
 * with no attributable CAC sink to the bottom.
 */
export function buildChannelCacReport(
  metrics: ChannelSpendConversions[],
  blendedCac: number | null,
  source: MetricSource,
  options: { window: string; estimated: boolean }
): ChannelCacReport {
  const rows: ChannelCacRow[] = metrics.map((m) => {
    const cac = m.newCustomers > 0 ? m.spend / m.newCustomers : null;
    const vsBlendedPct =
      cac !== null && blendedCac !== null && blendedCac > 0
        ? (cac - blendedCac) / blendedCac
        : null;
    return { ...m, cac, rating: rate(cac, blendedCac), vsBlendedPct };
  });

  rows.sort((a, b) => {
    if (a.cac === null) return 1;
    if (b.cac === null) return -1;
    return a.cac - b.cac;
  });

  return {
    currency: "EUR",
    window: options.window,
    blendedCac,
    source,
    estimated: options.estimated,
    rows,
    generatedAt: new Date().toISOString(),
  };
}
